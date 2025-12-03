module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'test', 'refactor', 'perf', 'style']
    ],
    'scope-enum': [
      2,
      'always',
      [
        // Packages
        'shared', 'ui', 'db', 'auth', 'ai-core', 'semantic-layer', 'data-plane', 'agents',
        // Apps
        'web', 'api',
        // Features (5 Core Modules)
        'deals', 'discovery', 'diligence', 'generator', 'command-center',
        // Infrastructure
        'infra', 'ci', 'deps'
      ]
    ],
    'subject-case': [0],
    'body-max-line-length': [0],
    'footer-max-line-length': [0]
  }
};
