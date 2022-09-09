function Game({ M }) {

    function Noise(Z0) {
        return M.random() * Z0 * 2 - Z0;
    }

    this.FrameRate = SmartValue("11111111");

    this.MaxFrames = this.FrameRate * 60 * 2;

    let Scale = SmartValue("00");

    let RoomCount = SmartValue("11110");
    let EnemyCount = Math.round(RoomCount * SmartValue("011"));
    let MinimumDotDistance = SmartValue("0");
    let DotPlacementAttempts = SmartValue("1111111111111");
    let PlayerRadius = SmartValue("0000");
    let DotRadius = SmartValue("00001");
    let ShotCooldown = Math.round(SmartValue("000") * this.FrameRate);
    let ShotCooldownLeft = 0;

    let Speed = SmartValue("11") * Scale / this.FrameRate;
    let PlayerShotSpeed = SmartValue("111") * Scale / this.FrameRate;
    let EnemyShotSpeed = SmartValue("1") * Scale / this.FrameRate;
    let ShotRadius = SmartValue("000") * Scale;
    let RotationSpeed = SmartValue("0000000");
    let EnemyShotChance = SmartValue("1110") / this.FrameRate;

    let PlayerRadiusScaled = PlayerRadius * Scale;


    let Frames = 0;

    let Direction = 0;
    let Point = { X: 0.5, Y: 0.5 };
    let Shots = [];

    let BackgroundImage;
    let SpaceshipImage;

    let StartTime;
    if (typeof window !== "undefined") StartTime = window.performance.now();

    let GameOver;


    let Replay = {
        DownUp: [[0, 0]],
        LeftRight: [[0, 0]],
        DirectionChange: [[0, 0]],
    };




    let Rooms;
    while (
        (() => {

            let Left = M.random() < 0.5;

            let RoomsInUse = {};

            for (let X = -1 - Left; X <= 2 - Left; X++) {
                for (let Y = -2; Y <= 1; Y++) {
                    RoomsInUse[X + " " + Y] = true;
                }
            }

            Rooms = [];

            Rooms.push({ X: 0, Y: 0 });
            Rooms.push({ X: 0, Y: -1 });
            Rooms.push({ X: 1 - Left * 2, Y: -1 });
            Rooms.push({ X: 2 - Left * 4, Y: -1 });

            let X = 2 - Left * 4;
            let Y = -1;
            let Direction = 1 + Left * 2;
            for (let A = 0; A < RoomCount; A++) {
                if (false) {
                } else if (M.random() < 1 / 3) {
                    Direction--;
                    Direction = mod(Direction, 4);
                } else if (M.random() < 1 / 2) {
                    Direction++;
                    Direction = mod(Direction, 4);
                }

                X += [0, 1, 0, -1][Direction];
                Y += [-1, 0, 1, 0][Direction];

                if (RoomsInUse[X + " " + Y]) return true;

                RoomsInUse[X + " " + Y] = true;
                Rooms.push({ X: X, Y: Y });
            }
        })()
    ) { }



    let RoomsObject = {};

    for (let Room of Rooms) {
        RoomsObject[Room.X + " " + Room.Y] = [];
    }






    let Dots = [];

    {

        let MinimumDotDistanceSquared = Math.pow(MinimumDotDistance, 2);

        let DotsObject = {};

        let EnemyCount2 = 0;

        for (let A = 0; A < DotPlacementAttempts; A++) {

            let RandomRoomIndex = 1 + Math.floor(M.random() * (Rooms.length - 1));

            let RandomRoom = Rooms[RandomRoomIndex];

            let NewDot = { X: RandomRoom.X + M.random() * (1 - DotRadius * 2) + DotRadius, Y: RandomRoom.Y + M.random() * (1 - DotRadius * 2) + DotRadius };

            let X2 = Math.floor(NewDot.X / MinimumDotDistance);
            let Y2 = Math.floor(NewDot.Y / MinimumDotDistance);

            if (!(() => {

                for (let X3 = X2 - 1; X3 <= X2 + 1; X3++) {
                    for (let Y3 = Y2 - 1; Y3 <= Y2 + 1; Y3++) {
                        if (DotsObject[X3 + " " + Y3]) {
                            for (let Dot of DotsObject[X3 + " " + Y3]) {
                                if (DistanceSquared(Dot, NewDot) < MinimumDotDistanceSquared) {
                                    return true;
                                }
                            }
                        }
                    }
                }

            })()) {

                if (RandomRoomIndex > 3 && EnemyCount2 < EnemyCount) {
                    NewDot.Enemy = true;
                    EnemyCount2++;
                } else {
                    NewDot.Rotation = M.random() * Math.PI * 2;
                    NewDot.RotationDirection = M.random() < 0.5 ? 1 : -1;
                }

                Dots.push(NewDot);
                if (!DotsObject[X2 + " " + Y2]) DotsObject[X2 + " " + Y2] = [];
                DotsObject[X2 + " " + Y2].push(NewDot);

            }


        }

    }



    let ParallaxScale = SmartValue("000");

    let BackgroundScale;

    let MyCanvas2;

    let Size;

    this.Prepare = async function () {

        return new Promise(function (Resolve, Reject) {

            let ImagesLeft = 7;

            function ImageLoaded() {
                ImagesLeft--;
                if (ImagesLeft === 0) {
                    Resolve();
                }
            }

            BackgroundImage = new Image();
            BackgroundImage.onload = ImageLoaded;
            BackgroundImage.src = 'Nebula.jpg';

            SpaceshipImage = new Image();
            SpaceshipImage.onload = ImageLoaded;
            SpaceshipImage.src = 'Spaceship.png';

            SpacePillarImage = new Image();
            SpacePillarImage.onload = ImageLoaded;
            SpacePillarImage.src = 'SpacePillar.png';

            EnemyImage = new Image();
            EnemyImage.onload = ImageLoaded;
            EnemyImage.src = 'Enemy.png';

            EnemyShotImage = new Image();
            EnemyShotImage.onload = ImageLoaded;
            EnemyShotImage.src = 'EnemyShot.png';

            PlayerShotImage = new Image();
            PlayerShotImage.onload = ImageLoaded;
            PlayerShotImage.src = 'PlayerShot.png';

            GroundImage = new Image();
            GroundImage.onload = ImageLoaded;
            GroundImage.src = 'Ground.jpg';

        });

    }

    this.CalculateFrame = function ({ DownUp, LeftRight, DirectionChange }) {

        if (Replay.DownUp[Replay.DownUp.length - 1][0] === DownUp) {
            Replay.DownUp[Replay.DownUp.length - 1][1]++;
        } else {
            Replay.DownUp.push([DownUp, 1]);
        }

        if (Replay.LeftRight[Replay.LeftRight.length - 1][0] === LeftRight) {
            Replay.LeftRight[Replay.LeftRight.length - 1][1]++;
        } else {
            Replay.LeftRight.push([LeftRight, 1]);
        }

        if (Replay.DirectionChange[Replay.DirectionChange.length - 1][0] === DirectionChange) {
            Replay.DirectionChange[Replay.DirectionChange.length - 1][1]++;
        } else {
            Replay.DirectionChange.push([DirectionChange, 1]);
        }

        let MouseSensitivity = SmartValue("00000000");

        Direction += DirectionChange * MouseSensitivity;


        if (DownUp && LeftRight) {
            LeftRight *= Math.sqrt(2) / 2;
            DownUp *= Math.sqrt(2) / 2;
        }



        function Check(Direction) {
            let PointBackup = JSON.parse(JSON.stringify(Point));

            Point.X += Math.sin(Direction) * Speed * DownUp;
            Point.Y -= Math.cos(Direction) * Speed * DownUp;
            Point.X += Math.cos(Direction) * Speed * LeftRight;
            Point.Y += Math.sin(Direction) * Speed * LeftRight;

            if (!RoomsObject[Math.floor(Point.X) + " " + Math.floor(Point.Y)]) {
                Point = PointBackup;
                return false;
            } else {


                for (let [, Dot] of Dots.entries()) {
                    let MyDistance = DistanceSquared(Point, Dot);
                    if (MyDistance < Math.pow(DotRadius + PlayerRadius * SmartValue("0"), 2)) {
                        Point = PointBackup;
                        return false;
                    }
                }

                return true;
            }
        }

        (() => {

            if (Check(Direction)) return;

            let Directions = SmartValue("1111");

            for (let Direction3 = 0; Direction3 < Directions; Direction3++) {
                let Direction4 = Direction3 / Directions * (Math.PI / 2);
                if (M.random() < 0.5) {
                    if (Check(Direction - Direction4)) return;
                    if (Check(Direction + Direction4)) return;
                } else {
                    if (Check(Direction + Direction4)) return;
                    if (Check(Direction - Direction4)) return;
                }
            }

        })();

        for (let A = Shots.length - 1; A >= 0; A--) {
            let Shot = Shots[A];
            let MyDistance = DistanceSquared(Point, Shot.Point);
            if (MyDistance < Math.pow(ShotRadius + PlayerRadius * SmartValue("0"), 2)) {
                GameOver = "Lost";
                break;
            }
        }

        if (
            ShotCooldownLeft === 0) {

            Shots.push({ Point: { X: Point.X + Math.sin(Direction) * PlayerRadius, Y: Point.Y - Math.cos(Direction) * PlayerRadius }, Direction: Direction + Noise(Math.PI * 2 * SmartValue("0000000")), Speed: PlayerShotSpeed, Source: "Player" });

            ShotCooldownLeft = ShotCooldown;
        } else {
            ShotCooldownLeft = Math.max(ShotCooldownLeft - 1, 0);
        }

        for (let Dot of Dots) {
            if (Dot.Enemy) {
                if (M.random() < EnemyShotChance) {
                    let Direction;
                    Direction = Math.atan2(Point.X - Dot.X, Dot.Y - Point.Y) + Noise(Math.PI / 2);
                    let EnemyRadius = DotRadius;
                    Shots.push({ Point: { X: Dot.X + Math.sin(Direction) * EnemyRadius, Y: Dot.Y - Math.cos(Direction) * EnemyRadius }, Direction, Speed: EnemyShotSpeed, Source: "Enemy" });
                }
            }
        }

        let CheckThisFrame = (Frames % Math.round(this.FrameRate * SmartValue("0000")) === 0);

        for (let A = Shots.length - 1; A >= 0; A--) {
            let Shot = Shots[A];
            Shots[A].Point.X += Math.sin(Shot.Direction) * Shot.Speed;
            Shots[A].Point.Y -= Math.cos(Shot.Direction) * Shot.Speed;

            if (!RoomsObject[Math.floor(Shot.Point.X) + " " + Math.floor(Shot.Point.Y)]) {
                Shots.splice(A, 1);
            } else {

                if (CheckThisFrame) {

                    for (let DotIndex = Dots.length - 1; DotIndex >= 0; DotIndex--) {
                        let Dot = Dots[DotIndex];
                        let MyDistance = DistanceSquared(Dot, Shot.Point);
                        if (MyDistance < Math.pow(DotRadius, 2)) {
                            Shots.splice(A, 1);

                            if (Shot.Source === "Player" && Dot.Enemy) {
                                Dots.splice(DotIndex, 1);
                                EnemyCount--;
                                if (EnemyCount === 0) {
                                    GameOver = "Won";
                                }
                            }

                        }

                    }

                }

            }



        }

        Frames++;

        // GameOver = "Won";

        if (Frames === this.MaxFrames) GameOver = "Lost";

        if (GameOver) {
            return {
                Result: GameOver,
                Frames,
                Replay
            };
        }

        return;

    }

    this.Draw = function ({ MyContext, Size: SizeNew }) {

        if (SizeNew !== Size) {
            Size = SizeNew;

            BackgroundScale = Size / 2 * Math.sqrt(2);

            MyCanvas2 = document.createElement("canvas");
            MyCanvas2.width = BackgroundScale * 2 * 3;
            MyCanvas2.height = BackgroundScale * 2 * 3;
            let MyContext2 = MyCanvas2.getContext("2d");
            for (let X = 0; X < 3; X++) {
                for (let Y = 0; Y < 3; Y++) {
                    MyContext2.drawImage(BackgroundImage, X * BackgroundScale * 2, Y * BackgroundScale * 2, BackgroundScale * 2, BackgroundScale * 2);
                }
            }
        }

        MyContext.fillStyle = "rgba(128, 128, 128, 1)";
        MyContext.fillRect(0, 0, Size, Size);


        MyContext.save();
        MyContext.translate(Size / 2, Size / 2);
        MyContext.rotate(-Direction);
        MyContext.translate(-Size / 2, -Size / 2);

        MyContext.drawImage(MyCanvas2, Size / 2 - BackgroundScale * 2 - mod(Point.X * ParallaxScale * Size, BackgroundScale * 2), Size / 2 - BackgroundScale * 2 - mod(Point.Y * ParallaxScale * Size, BackgroundScale * 2), BackgroundScale * 2 * 3, BackgroundScale * 2 * 3);

        MyContext.restore();



        MyContext.save();





        MyContext.translate(0.5 * Size, 0.5 * Size);
        MyContext.rotate(-Direction);
        MyContext.translate(-Point.X * Size * Scale, -Point.Y * Size * Scale);








        MyContext.fillStyle = "rgba(64, 64, 64, 1)";
        for (let Room of Rooms) {
            MyContext.drawImage(GroundImage, Room.X * Size * Scale, Room.Y * Size * Scale, Size * Scale, Size * Scale);
        }



        MyContext.save();
        MyContext.translate(Point.X * Size * Scale, Point.Y * Size * Scale);
        MyContext.rotate(Math.PI + Direction);
        MyContext.translate(-Point.X * Size * Scale, -Point.Y * Size * Scale);
        MyContext.drawImage(SpaceshipImage, Point.X * Size * Scale - PlayerRadiusScaled * Size, Point.Y * Size * Scale - PlayerRadiusScaled * Size, PlayerRadiusScaled * 2 * Size, PlayerRadiusScaled * 2 * Size);
        MyContext.restore();






        for (let Dot of Dots) {
            let DotRadius2 = DotRadius * (Dot.Enemy ? SmartValue("10") : 1);
            MyContext.save();
            MyContext.translate(Dot.X * Size * Scale, Dot.Y * Size * Scale);
            MyContext.rotate(Dot.Enemy ? Math.PI * Math.random() * 2 : Dot.Rotation + (window.performance.now() - StartTime) * RotationSpeed * Dot.RotationDirection);
            MyContext.drawImage(Dot.Enemy ? EnemyImage : SpacePillarImage, -DotRadius2 * Size * Scale, -DotRadius2 * Size * Scale, DotRadius2 * Size * Scale * 2, DotRadius2 * Size * Scale * 2);
            MyContext.restore();
        }


        for (let A = 0; A < Shots.length; A++) {

            if (Shots[A].Source === "Player") {

                let ShotRadius2 = ShotRadius * SmartValue("");
                MyContext.save();
                MyContext.translate(Shots[A].Point.X * Size * Scale, Shots[A].Point.Y * Size * Scale);
                MyContext.rotate(Math.PI * Math.random() * 2);
                MyContext.drawImage(PlayerShotImage, -ShotRadius2 * Size * Scale, -ShotRadius2 * Size * Scale, ShotRadius2 * Size * Scale * 2, ShotRadius2 * Size * Scale * 2);
                MyContext.restore();

            }

        }

        for (let A = 0; A < Shots.length; A++) {

            if (Shots[A].Source === "Enemy") {

                let ShotRadius2 = ShotRadius * SmartValue("10");
                MyContext.save();
                MyContext.translate(Shots[A].Point.X * Size * Scale, Shots[A].Point.Y * Size * Scale);
                MyContext.rotate(Math.PI * Math.random() * 2);
                MyContext.drawImage(EnemyShotImage, -ShotRadius2 * Size * Scale, -ShotRadius2 * Size * Scale, ShotRadius2 * Size * Scale * 2, ShotRadius2 * Size * Scale * 2);
                MyContext.restore();

            }

        }

        function FormatTime(Z0) {
            Minutes = Math.floor(Z0 / 60);
            Z0 -= Minutes * 60;
            Seconds = Math.floor(Z0);
            Z0 -= Seconds;
            Z0 *= 10;
            return Minutes + ":" + ("0" + Seconds).slice(-2) + "." + Math.floor(Z0);
        }

        MyContext.restore();

        let FontSize = Math.round(Size * SmartValue("00000"));

        MyContext.fillStyle = "#ff0";
        MyContext.font = FontSize + "px Calibri";
        MyContext.textAlign = "right";
        MyContext.textBaseline = "bottom";
        MyContext.fillText("Time left: " + FormatTime((this.MaxFrames - Frames) / this.FrameRate), Size - Math.round(FontSize * SmartValue("00")), Size + Math.round(FontSize * SmartValue("0001")) - Math.round(FontSize * SmartValue("00")));

        if (GameOver === "Lost") {
            MyContext.textAlign = "center";
            MyContext.textBaseline = "middle";
            {
                let FontSize = Math.round(Size * SmartValue("000"));
                MyContext.font = FontSize + "px Calibri";
                MyContext.fillText("You died", Size / 2, Size * SmartValue("0011"));
            }
            {
                let FontSize = Math.round(Size * SmartValue("00000"));
                MyContext.font = FontSize + "px Calibri";
                MyContext.fillText("Click to continue", Size / 2, Size * SmartValue("010001"));
            }
        } else if (GameOver === "Won") {
            MyContext.textAlign = "center";
            MyContext.textBaseline = "middle";
            {
                let FontSize = Math.round(Size * SmartValue("000"));
                MyContext.font = FontSize + "px Calibri";
                MyContext.fillText("You won!", Size / 2, Size * SmartValue("0011"));
            }
            {
                let FontSize = Math.round(Size * SmartValue("00000"));
                MyContext.font = FontSize + "px Calibri";
                MyContext.fillText("Click to continue", Size / 2, Size * SmartValue("010001"));
            }
        }


    }



}

function DistanceSquared(Point1, Point2) {
    return Math.pow(Point2.X - Point1.X, 2) + Math.pow(Point2.Y - Point1.Y, 2);
}

function mod(m, n) {
    return ((m % n) + n) % n;
};

let SmartValueCache = {};

function SmartValue(Z0) {
    if (SmartValueCache[Z0] !== undefined) return SmartValueCache[Z0];
    let min = 0;
    let max = 1;
    let i = 0;
    while (i < Z0.length && Z0[i] === "1") {
        min = max;
        max *= 2;
        i++;
    }
    let cur = max;
    for (; i < Z0.length; i++) {
        if (Z0[i] === "0") {
            max = cur;
        } else {
            min = cur;
        }
        cur = min + (max - min) / 2;
    }
    SmartValueCache[Z0] = cur;
    return cur;
}

if (typeof window === "undefined") module.exports = Game;
