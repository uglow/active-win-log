'use strict';

const mockActiveWin = jest.fn();
jest.mock('active-win', () => mockActiveWin);

const { ActiveWinLog } = require('./activeWinLog.js');
const path = require('path');
const userhome = require('userhome');

describe('ActiveWinLog', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('init()', () => {
    it('should set the logFile to the users home directory by default', async () => {
      const awl = new ActiveWinLog({});
      await awl.init();
      expect(awl.logFile).toEqual(path.join(userhome('.active-win-log'), 'awl.json'));
    });
  });

  describe('showHelp()', () => {
    it('should display a help message', () => {
      const awl = new ActiveWinLog({ logFile: 'foo.json' });
      const output = awl.showHelp().split('\n');

      expect(output).toMatchSnapshot();
    });
  });

  describe('getStats()', () => {
    it('should render stats from a (fixture) log file', async () => {
      const awl = new ActiveWinLog({ logFile: path.join(__dirname, '../fixtures/awl.json') });
      const output = await awl.getStats({ lastNDays: 2 });

      expect(output).toMatchSnapshot();
    });
  });

  describe('recordActiveWin()', () => {
    it('should not write to the log file when the active-win library returns a falsey value', async () => {
      const awl = new ActiveWinLog({ logFile: path.join(__dirname, '../fixtures/awl.json') });
      awl.getLogFileData = jest.fn();
      awl.setLogFileData = jest.fn();
      mockActiveWin.mockResolvedValue(null);

      await awl.recordActiveWin();

      // We bailed, so neither method was called
      expect(awl.getLogFileData).not.toHaveBeenCalled();
      expect(awl.setLogFileData).not.toHaveBeenCalled();
    });

    it('should not write to the log file when the active-win library throws an error', async () => {
      const awl = new ActiveWinLog({ logFile: path.join(__dirname, '../fixtures/awl.json') });
      awl.getLogFileData = jest.fn();
      awl.setLogFileData = jest.fn();
      mockActiveWin.mockRejectedValue(new Error('Test: something went wrong'));

      await awl.recordActiveWin();

      // We bailed, so neither method was called
      expect(awl.getLogFileData).not.toHaveBeenCalled();
      expect(awl.setLogFileData).not.toHaveBeenCalled();
    });

    it('should write the active-win window information to the log file', async () => {
      const awl = new ActiveWinLog({ logFile: path.join(__dirname, '../fixtures/awl.json') });
      awl.getLogFileData = jest.fn().mockResolvedValue({ stats: {} });
      awl.setLogFileData = jest.fn();
      mockActiveWin.mockResolvedValue({
        title: 'garbo.org',
        owner: {
          name: 'FireFox',
        },
      });

      await awl.recordActiveWin('2019-03-22T10:45:01.234Z');

      // We bailed, so neither method was called
      expect(awl.getLogFileData).toHaveBeenCalled();
      expect(awl.setLogFileData).toHaveBeenCalledWith({
        stats: {
          '2019-03-22': {
            FireFox: {
              'garbo.org': ['2019-03-22T10:45:01.234Z'],
            },
          },
        },
      });
    });
  });
});
