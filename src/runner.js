'use strict';

const { ActiveWinLog, COMMANDS } = require('./activeWinLog');

async function run(args = '') {
  // Before we try to run anything in the background, just check the args
  const awl = new ActiveWinLog();
  await awl.init();

  const firstArg = args.length > 2 ? args[2] : '';
  const secondArg = args.length > 3 ? args[3] : '_';

  // Show the help if there is an argument AND it is the help command OR it does not match any command
  if (firstArg && (firstArg === COMMANDS.HELP || !Object.values(COMMANDS).includes(firstArg))) {
    console.log(awl.showHelp());
    return;
  }

  if (firstArg === COMMANDS.PRINT) {
    console.log(await awl.getStats({ lastNDays: !isNaN(Number(secondArg)) ? secondArg : 1 }));
    return;
  }

  if (firstArg === COMMANDS.QUIT) {
    console.log('Stopping active-win-log...');
    await awl.killExistingProcess();
    console.log('Stopped.');
    return;
  }

  // Kill the existing process if it exists
  await awl.killExistingProcess();

  console.log('Running active-win-log in the background. Type `awl -q` to stop it running.');

  // Now run the script in the background again
  require('daemonize-process')();
  awl.run();
}

module.exports = {
  run,
};
