import { getJIRAIssueKey, getJIRAIssueKeysByCustomRegexp, getPRDescription, shouldSkipBranchLint } from '../src/utils';
import { HIDDEN_MARKER_END, HIDDEN_MARKER_START, WARNING_MESSAGE_ABOUT_HIDDEN_MARKERS } from '../src/constants';

jest.spyOn(console, 'log').mockImplementation(); // avoid actual console.log in test output

describe('shouldSkipBranchLint()', () => {
  it('should recognize bot PRs', () => {
    expect(shouldSkipBranchLint('dependabot')).toBe(true);
    expect(shouldSkipBranchLint('dependabot/npm_and_yarn/types/react-dom-16.9.6')).toBe(true);
    expect(shouldSkipBranchLint('feature/add-dependabot-config')).toBe(false);
    expect(shouldSkipBranchLint('feature/add-dependabot-config-OSS-101')).toBe(false);
  });

  it('should handle custom ignore patterns', () => {
    expect(shouldSkipBranchLint('bar', '^bar')).toBeTruthy();
    expect(shouldSkipBranchLint('foobar', '^bar')).toBeFalsy();

    expect(shouldSkipBranchLint('bar', '[0-9]{2}')).toBeFalsy();
    expect(shouldSkipBranchLint('bar', '')).toBeFalsy();
    expect(shouldSkipBranchLint('foo', '[0-9]{2}')).toBeFalsy();
    expect(shouldSkipBranchLint('f00', '[0-9]{2}')).toBeTruthy();

    const customBranchRegex = '^(production-release|master|release/v\\d+)$';
    expect(shouldSkipBranchLint('production-release', customBranchRegex)).toBeTruthy();
    expect(shouldSkipBranchLint('master', customBranchRegex)).toBeTruthy();
    expect(shouldSkipBranchLint('release/v77', customBranchRegex)).toBeTruthy();

    expect(shouldSkipBranchLint('release/very-important-feature', customBranchRegex)).toBeFalsy();
    expect(shouldSkipBranchLint('masterful', customBranchRegex)).toBeFalsy();
    expect(shouldSkipBranchLint('productionish', customBranchRegex)).toBeFalsy();
    expect(shouldSkipBranchLint('fix/production-issue', customBranchRegex)).toBeFalsy();
    expect(shouldSkipBranchLint('chore/rebase-with-master', customBranchRegex)).toBeFalsy();
    expect(shouldSkipBranchLint('chore/rebase-with-release', customBranchRegex)).toBeFalsy();
    expect(shouldSkipBranchLint('chore/rebase-with-release/v77', customBranchRegex)).toBeFalsy();
  });

  it('should return false with empty input', () => {
    expect(shouldSkipBranchLint('')).toBeFalsy();
  });

  it('should return false for other branches', () => {
    expect(shouldSkipBranchLint('feature/awesomeNewFeature')).toBeFalsy();
  });
});

describe('getJIRAIssueKeys()', () => {
  it('gets jira key from different branch names', () => {
    expect(getJIRAIssueKey('fix/login-protocol-es-43')).toEqual('ES-43');
    expect(getJIRAIssueKey('fix/login-protocol-ES-43')).toEqual('ES-43');
    expect(getJIRAIssueKey('feature/newFeature_esch-100')).toEqual('ESCH-100');
    expect(getJIRAIssueKey('feature/newFeature_ESCH-101')).toEqual('ESCH-101');
    expect(getJIRAIssueKey('feature/newFeature--mojo-5611')).toEqual('MOJO-5611');
    expect(getJIRAIssueKey('feature/newFeature--MOJO-6789')).toEqual('MOJO-6789');

    expect(getJIRAIssueKey('chore/task-with-dashes--MOJO-6789')).toEqual('MOJO-6789');
    expect(getJIRAIssueKey('chore/task_with_underscores--MOJO-6789')).toEqual('MOJO-6789');
    expect(getJIRAIssueKey('chore/MOJO-6789-task_with_underscores')).toEqual('MOJO-6789');
    expect(getJIRAIssueKey('MOJO-6789/task_with_underscores')).toEqual('MOJO-6789');

    expect(getJIRAIssueKey('MOJO-6789/task_with_underscores-ES-43')).toEqual('MOJO-6789');
    expect(getJIRAIssueKey('nudge-live-chat-users-Es-172')).toEqual('ES-172');

    expect(getJIRAIssueKey('feature/missingKey')).toEqual(null);
    expect(getJIRAIssueKey('')).toEqual(null);
  });
});

describe('getJIRAIssueKeys()', () => {
  it('gets multiple keys from a string using provided regexp', () => {
    expect(getJIRAIssueKeysByCustomRegexp('18,345', '\\d+', 'PRJ')).toEqual('PRJ-18');
  });

  it('gets jira keys from different branch names', () => {
    expect(getJIRAIssueKeysByCustomRegexp('fix/login-protocol-es-43', '^\\d+', 'QQ')).toEqual(null);
    expect(getJIRAIssueKeysByCustomRegexp('43-login-protocol', '^\\d+', 'QQ')).toEqual('QQ-43');
  });
});

describe('getPRDescription()', () => {
  it('should replace old issue info with new', () => {
    const old = 'old issue body';
    const issueInfo = 'infoAboutJiraTesk';
    const description = getPRDescription(old, issueInfo);

    expect(description).toEqual(`${HIDDEN_MARKER_START}
${issueInfo}
${WARNING_MESSAGE_ABOUT_HIDDEN_MARKERS}
${HIDDEN_MARKER_END}

${old}`);
  });
  //it('should replace old issue info with new', () => {
  //  const description = getPRDescription('old issue body', 'updates');
  //
  //  expect(description).toContain(issue.key);
  //});
});

//describe('buildPRDescription()', () => {
//  it('should include the hidden marker when getting PR description', () => {
//    const issue: JIRADetails = {
//      key: 'ABC-123',
//      url: 'url',
//      type: { name: 'feature', icon: 'feature-icon-url' },
//      summary: 'Story title or summary',
//      project: { name: 'project', url: 'project-url', key: 'abc' },
//    };
//    const description = buildPRDescription(issue);
//
//    expect(shouldUpdatePRDescription(description)).toBeFalsy();
//    expect(description).toContain(issue.key);
//  });
//});
