'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const statAsync = promisify(fs.stat);
const mkDirAsync = promisify(fs.mkdir);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const activeWin = require('active-win');
const userhome = require('userhome');
const LOG_FILE = 'awl.json';
const COMMANDS = {
  HELP: '-?',
  PRINT: '-l',
  QUIT: '-q',
};
const WIN_MEASURE_INTERVAL = 5000; // Check for the active window every 5 seconds

/**
 * ActiveWinLog - stores the name of the log file that is being used
 * @param {string[]} args   - command line arguments
 * @param {string} cwd      - current working directory (necessary for local devlogs)
 * @param {string} logFile  - full path to the logfile to use
 * @constructor
 */

class ActiveWinLog {
  // Use a class because
  constructor({ logFile = path.join(userhome('.active-win-log'), LOG_FILE) } = {}) {
    this.logFile = logFile;
  }

  async init() {
    try {
      await statAsync(this.logFile);
    } catch (err) {
      // Create directory & file
      try {
        await mkDirAsync(path.dirname(this.logFile)); // This could fail if the directory exists, which is fine
      } catch (err2) {
        // ignore error here
      }
      this.setLogFileData({ pid: process.pid, stats: {} });
    }
  }

  showHelp() {
    return [
      '\nUsage: awl <options>',
      'awl           Start monitoring the active window',
      `awl ${COMMANDS.HELP}        This help information`,
      `awl ${COMMANDS.PRINT} n      Display statistics for the last "n" days in the log`,
      `awl ${COMMANDS.QUIT}        Stop monitoring`,
      `Global log location: ${this.logFile}`,
    ].join('\n');
  }

  async run() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(WIN_MEASURE_INTERVAL);
      await this.recordActiveWin();
    }
  }

  async recordActiveWin(eventDateTime = new Date().toLocaleString()) {
    let winInfo = null;

    try {
      winInfo = await activeWin();
    } catch (err) {
      // no need to do anything, we will bail shortly
    }

    // If there are no active windows, don't log anything
    if (!winInfo) {
      return;
    }

    const logFileObj = await this.getLogFileData();
    const eventDate = eventDateTime.substr(0, 10); // Just the date-part of the string

    // Add a record to the log file, grouped by day
    const dateKey = (logFileObj.stats[eventDate] = logFileObj.stats[eventDate] || {});
    const appKey = (dateKey[winInfo.owner.name] = dateKey[winInfo.owner.name] || {});
    const titleKey = (appKey[winInfo.title] = appKey[winInfo.title] || []);

    // Add a new value
    titleKey.push(eventDateTime);

    await this.setLogFileData(logFileObj);
  }

  async getStats({ lastNDays = 1 }) {
    const c = require('ansi-colors');
    const logFileObj = await this.getLogFileData();
    const dateKeys = Object.keys(logFileObj.stats);

    // Take the date from the end of the file (newest at the end), then process it oldest-first
    const keysToDisplay = dateKeys
      .reverse()
      .slice(0, lastNDays)
      .reverse();

    const output = []; // Store the output as array of strings, for rendering how you wish.

    // This is not the most elegant algorithm or output, but it's good enough for my needs.
    keysToDisplay.forEach(day => {
      // Start bottom-up: get the total time from the app-windows, then group by app, then by day
      const windowTime = Object.keys(logFileObj.stats[day]).map(app =>
        Object.keys(logFileObj.stats[day][app]).map(win => ({
          name: win,
          time: logFileObj.stats[day][app][win].length * WIN_MEASURE_INTERVAL, // count time stamps
        }))
      );

      const appTime = Object.keys(logFileObj.stats[day]).map((app, i) => ({
        name: app,
        time: windowTime[i].reduce((acc, curr) => acc + curr.time, 0), // sum the time from the child windows
      }));

      const dayTime = { name: day, time: appTime.reduce((acc, curr) => acc + curr.time, 0) };

      output.push(formatStatLine(dayTime, c.yellow.bold.underline, c.yellow.bold.underline));
      appTime.forEach((app, i) => {
        output.push(formatStatLine(app, c.green, c.green.bold));
        windowTime[i].forEach(win => output.push(formatStatLine(win, c.cyan, c.cyan, 2)));
      });

      output.push(''); // line separating each day
    });
    return output.join('\n');
  }

  async killExistingProcess() {
    const logFileObj = await this.getLogFileData();
    try {
      process.kill(logFileObj.pid, 'SIGHUP');
    } catch (err) {
      // Probably no process to kill. Ignore
    }
    // Update the logFileData with this process's processId
    logFileObj.pid = process.pid;
    await this.setLogFileData(logFileObj);
  }

  async getLogFileData() {
    const logFile = await readFileAsync(this.logFile);
    return JSON.parse(logFile);
  }

  async setLogFileData(jsObj) {
    await writeFileAsync(this.logFile, JSON.stringify(jsObj, null, '\t'));
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatMillis(milliseconds) {
  const seconds = Math.round(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  const remainingSeconds = seconds - hours * 3600 - minutes * 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(remainingSeconds).padStart(2, '0'),
  ].join(':');
}

function formatStatLine(nameTime, nameStyleFn, totalStyleFn, indent = 0, charLength = 50 - indent) {
  return `${' '.repeat(indent)}${nameStyleFn(
    (nameTime.name || '<blank>').substr(0, charLength).padEnd(charLength, ' ') + '  '
  )}${totalStyleFn(formatMillis(nameTime.time))}`;
}

module.exports = {
  ActiveWinLog,
  COMMANDS,
};
