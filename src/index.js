#!/usr/bin/env node

import moment from "moment";
import inquirer from "inquirer";
import { execSync } from "node:child_process";

const date = moment();
const now = date.format("YYYYMMDD");

let gitBranches = [];
try {
  gitBranches = execSync("git branch")
    .toString()
    .split("\n")
    .map((branch) => branch.trim())
    .filter((branch) => branch !== "")
} catch (error) {
  console.info('No git repository found');
  process.exit(1);
}

if (gitBranches.length === 0) {
  console.info('No git branches found');
  process.exit(1);
}

const currentBranch = gitBranches.find((branch) => branch.includes("*"));
if (currentBranch) {
  gitBranches.splice(gitBranches.indexOf(currentBranch), 1);
  gitBranches.unshift(currentBranch.replace("*", "").trim());
}

if (gitBranches.includes("main")) {
  gitBranches.splice(gitBranches.indexOf("main"), 1);
  gitBranches.unshift("main");
}

async function main() {

  const { branch } = await inquirer.prompt([{ type: "list", name: "branch", message: `Branch (default: ${gitBranches[0]}): `, choices: gitBranches }]);
  const { confirmBranch } = await inquirer.prompt([{ type: "confirm", name: "confirmBranch", message: `Are you sure? You will be checking out and pulling branch ${branch}`, default: false }]);
  if (!confirmBranch) {
    return;
  }

  try {
    console.info(`Checking out and pulling branch: ${branch}`);
    execSync(`git checkout ${branch} && git pull origin ${branch}`);
  } catch (error) {
    console.info('Error while checking out and pulling branch');
    return;
  }

  const { prefix } = await inquirer.prompt([{ type: "input", name: "prefix", message: "Prefix (default: STG): ", default: "STG", validate: (value) => value.length > 0 }]);

  let gitTag;
  let newTag;
  let addCounter = 0;

  try {
    gitTag = execSync(`git tag | grep ${prefix}_${now}`).toString();
    gitTag = gitTag.split("\n");

    gitTag = gitTag.filter((tag) => tag !== "");
    gitTag.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    const lastTag = gitTag[gitTag.length - 1];
    const splitTag = lastTag.split("_");

    if (splitTag.length === 3) {
      addCounter = parseInt(splitTag[splitTag.length - 1]) + 1;
    }
    newTag = `${prefix}_${now}_${addCounter}`;
  } catch (error) {
    newTag = `${prefix}_${now}_${addCounter}`;
  }

  const { commit } = await inquirer.prompt([{ type: "input", name: "commit", message: `Commit Message (default: ${newTag}): `, default: newTag, validate: (value) => value.length > 0 }]);

  const { confirm } = await inquirer.prompt([{ type: "confirm", name: "confirm", message: `Are you sure want to create tag ${newTag} for branch ${branch} ?`, default: false }]);
  if (confirm) {
    try {
      console.info(`Creating tag: ${newTag}`);
      execSync(`git tag -a ${newTag} -m "${commit}"`);
    } catch (error) {
      console.info('Error while creating tag');
      return;
    }

    try {
      console.info(`Pushing tag: ${newTag}`);
      execSync(`git push origin ${newTag}`);
    } catch (error) {
      console.info('Error while pushing tag');
      return;
    }
  } else {
    return;
  }
}

main();
