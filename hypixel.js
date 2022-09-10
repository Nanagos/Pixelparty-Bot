/*
    This Bot is automaticly playing the prototype game "pixel party" on hypixel.
*/

const mineflayer = require("mineflayer");
const chat = require("./chat.js");
const { Vec3 } = require("vec3");
const readline = require("readline");

const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalBlock } = require('mineflayer-pathfinder').goals

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const size = 31;
let blocks;
let hasSeen;
let isInGame = false;

const colors = {
    "WHITE": 0,
    "ORANGE": 1,
    "MAGENTA": 2,
    "LIGHTBLUE": 3,
    "YELLOW": 4,
    "LIME": 5,
    "PINK": 6,
    "DARKGRAY": 7,
    "LIGHTGRAY": 8,
    "CYAN": 9,
    "PURPLE": 10,
    "BLUE": 11,
    "BROWN": 12,
    "GREEN": 13,
    "RED": 14,
    "BLACK": 15
}

const bot = mineflayer.createBot({
    host: "mc.hypixel.net",
    version: "1.8",
    username: "",
    password: "",
    auth: "microsoft",
    plugins: [
        pathfinder
    ]
});

const mcData = require('minecraft-data')(bot.version);
const defaultMove = new Movements(bot, mcData);

setInterval(() => {
    if(!isInGame) return;
    bot.swingArm();
}, 2000);

bot.once("login", () => {
    rl.on("line", text => {
        const args = text.split(" ");
        args.shift();

        if(text.startsWith("cmd")) {
            bot.chat(`/${args.join(" ")}`);
        } else if(text.startsWith("say")) {
            bot.chat(args.join(" "));
        } else if(text.startsWith("play")) {
            bot.chat("/play prototype_pixel_party");
            console.log("Joining pixel party");
        }

    });
});



bot.on("message", (json) => {
    const msg = chat.convertJson(json);

    if(msg === "The game starts in 1 second!") {
        isInGame = true;
        console.log("Game started!");
    }
    else if(msg === `✖ ${bot.username} fell to their death!`) { 
        console.log("The bot died!");
        isInGame = false;
        bot.pathfinder.setGoal(null);
    } else if(msg.replace(/[ ]+/g, "") === bot.username) {
        console.log("The bot won the round!");
        isInGame = false;
        bot.pathfinder.setGoal(null);
    }
});

bot.on("actionBar", (json) => {
    if(!isInGame) return;

    const msg = chat.convertJson(json);

    if(msg === "Waiting...") {
        console.log("STATE: WAITING");
        searchStandingLocation();
    } else if(msg.includes("▇")) {
        if(hasSeen) return;
        hasSeen = true;

        console.log("STATE: FIND BLOCK");

        const color = msg.replace(/[▂▃▄▅▆▇ ]/g, "");
        const md = colors[color];

        console.log(`Color: ${color}; Id: ${md}`);
        goToNextBlock(md);
    } else if(msg === "✖ FREEZE ✖") {
        hasSeen = false;
        console.log("STATE: FREEZE");
    }
});

function searchStandingLocation() {
    let colors = {};
    blocks = [];
    for(let i = -size; i <= size; i++) {
        for(let j = -size; j <= size; j++) {
            const block = bot.blockAt(new Vec3(i, 0, j));
            
            if(block === null) continue;
            if(block.name !== "stained_hardened_clay") continue;

            if(!colors.hasOwnProperty(block.metadata)) colors[block.metadata] = null;

            blocks.push(block);
        }
    }

    const toPlayer = false;
    const pos = toPlayer ? bot.entity.position : new Vec3(0, 1, 0);
    blocks2 = blocks.sort((b1, b2) => {
        return b1.position.distanceTo(pos) - b2.position.distanceTo(pos);
    });

    blocks2.forEach(block => {
        if(colors[block.metadata] === null) {
            colors[block.metadata] = block;
        }
    });

    let totalX = 0;
    let totalZ = 0;
    let amount = 0;
    Object.values(colors).forEach(block => {
        totalX += block.position.x;
        totalZ += block.position.z;
        amount += 1;
    });

    let position = new Vec3(totalX / amount, 1, totalZ / amount);

    console.log(`Found new location ${Math.round(position.distanceTo(bot.entity.position))} meters away. (${position})`);

    goTo(position.x, position.z);

}

function goToNextBlock(color) {

    const blocks2 = blocks
        .filter(b => b.metadata === color)
        .sort((b1, b2) => {
            return b1.position.distanceTo(bot.entity.position) - b2.position.distanceTo(bot.entity.position);
        });
    
    if(blocks2.length === 0) {
        console.log("The Bot could not find any blocks with this color!");
        return;
    }
    
    const block = blocks2[0];

    console.log(`Found block ${Math.round(block.position.distanceTo(bot.entity.position))} meters away. (${block.position})`);
    
    goTo(block.position.x, block.position.z);

}

function goTo(x, z) {

    //  walking: 4.317 m/s
    //  sprinting: 5.612 m/s
    //  sprintjumping: 7.127 m/s

    let speed = 5.612;

    x = x + 0.5;
    z = z + 0.5;
    let dx = x - bot.entity.position.x;
    let dz = z - bot.entity.position.z;
    let distance = Math.sqrt(dx*dx + dz*dz);

    bot.lookAt(new Vec3(x, 1, z));

    let counter = 0;
    let move = () => {
        counter++;
        bot.entity.velocity = new Vec3(-Math.sin(bot.entity.yaw) * (speed / 20), bot.entity.velocity.y, -Math.cos(bot.entity.yaw) * (speed / 20));
        if(counter < distance / speed * 16) setTimeout(move, 50);
        else {
            bot.pathfinder.setMovements(defaultMove);
            bot.pathfinder.setGoal(new GoalBlock(x, 1, z, 1));
        }
    };

    move();

}
