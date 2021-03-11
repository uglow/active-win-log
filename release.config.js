module.exports = {
  branches: ['master'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    '@semantic-release/npm',
    [
      '@semantic-release/github',
      {
        assets: ['*'],
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'], // Commit changelog and package.json back to git, and don't trigger a build (skip ci)
        // eslint-disable-next-line no-template-curly-in-string
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
