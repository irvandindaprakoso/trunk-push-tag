const { execSync } = require("node:child_process");
const moment = require("moment");
const date = moment();
const now = date.format("YYYYMMDD");

const prompt = require("prompt-sync")();

let env = prompt("ENV: ");
env = env.toUpperCase();

if (!["STG", "PROD"].includes(env)) {
    console.error('Please select "PROD" or "STG".');
    return;
}

if (env === "PROD") {
    let confirm = prompt("Are you sure want to deploy to PRODUCTION ? n/y: ");
    confirm = confirm.toUpperCase();

    if (!["Y", "N"].includes(confirm)) {
        console.error('Please select "n" or "y".');
        return;
    }

    if (confirm === "N") {
        console.error("OK, please retry.");
        return;
    }
}

const commit = prompt("commit: ");

if (!commit) {
    console.error("Please add commit.");
    return;
}

console.info(`OK. otw...`);
console.info(`______________________________`);

try {
    execSync(`git checkout main && git pull origin main`);
} catch (err) {
    console.error("please stash or commit your changes before run this script")
    return
}

console.info(`______________________________`);

let gitTag;
let newTag;
let addCounter = 0;

try {
    gitTag = execSync(`git tag | grep ${env}_${now}`).toString();
    gitTag = gitTag.split("\n");

    const lastTag = gitTag[gitTag.length - 2];

    const splitTag = lastTag.split("_");

    if (splitTag.length === 3) {
        addCounter = parseInt(splitTag[splitTag.length - 1]) + 1;
    }

    newTag = `${env}_${now}_${addCounter}`;
} catch (error) {
    newTag = `${env}_${now}_${addCounter}`;
}

let pushTag = `git tag -a ${newTag} -m "${commit}" && git push origin ${newTag}`;

execSync(pushTag);

console.info(pushTag);

console.info(`______________________________`);

console.info(`Finished push tag -> ${newTag}`);
