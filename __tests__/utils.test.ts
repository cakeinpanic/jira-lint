import {
  getJIRAIssueKey,
  getJIRAIssueKeysByCustomRegexp,
  getPRDescription,
  shouldSkipBranchLint,
  shouldUpdatePRDescription,
} from '../src/utils';
import { HIDDEN_MARKER } from '../src/constants';
import { JIRADetails } from '../src/types';

jest.spyOn(console, 'log').mockImplementation(); // avoid actual console.log in test output

describe('shouldSkipBranchLint()', () => {
  it('should recognize bot PRs', () => {
    expect(shouldSkipBranchLint('dependabot')).toBe(true);
    expect(shouldSkipBranchLint('dependabot/npm_and_yarn/types/react-dom-16.9.6')).toBe(true);
    expect(shouldSkipBranchLint('feature/add-dependabot-config')).toBe(false);
    expect(shouldSkipBranchLint('feature/add-dependabot-config-OSS-101')).toBe(false);

    expect(shouldSkipBranchLint('all-contributors')).toBe(true);
    expect(shouldSkipBranchLint('all-contributors/add-ghost')).toBe(true);
    expect(shouldSkipBranchLint('chore/add-all-contributors')).toBe(false);
    expect(shouldSkipBranchLint('chore/add-all-contributors-OSS-102')).toBe(false);
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

describe('shouldUpdatePRDescription()', () => {
  it('should return false when the hidden marker is present', () => {
    expect(shouldUpdatePRDescription(HIDDEN_MARKER)).toBeFalsy();
    expect(
      shouldUpdatePRDescription(`
<details open>
  <summary> <strong>ESCH-10</strong></summary>
  <br />
  <table>
    <tr>
      <td>Type</td>
      <td>feature</td>
    </tr>
    <tr>
      <td>Points</td>
      <td>2</td>
    </tr>
    <tr>
      <td>Labels</td>
      <td>fe tech goodness, gst 2.0</td>
    </tr>
  </table>
</details>
<!--
  do not remove this marker as it will break jira-lint's functionality.
  ${HIDDEN_MARKER}
-->

some actual content'
    `)
    ).toBeFalsy();
  });

  it('should return true when the hidden marker is NOT present', () => {
    expect(shouldUpdatePRDescription('')).toBeTruthy();
    expect(shouldUpdatePRDescription('added_by')).toBeTruthy();
    expect(shouldUpdatePRDescription('added_by_something_else')).toBeTruthy();
    expect(
      shouldUpdatePRDescription(`
## Checklist

- [ ] PR is up-to-date with a description of changes and screenshots (if applicable).
- [ ] All files are lint-free.
- [ ] Added tests for the core-changes (as applicable).
- [ ] Tested locally for regressions & all test cases are passing.
`)
    ).toBeTruthy();
  });
});

describe('getPRDescription()', () => {
  it('should include the hidden marker when getting PR description', () => {
    const issue: JIRADetails = {
      key: 'ABC-123',
      url: 'url',
      type: { name: 'feature', icon: 'feature-icon-url' },
      summary: 'Story title or summary',
      project: { name: 'project', url: 'project-url', key: 'abc' },
    };
    const description = getPRDescription('some_body', issue);

    expect(shouldUpdatePRDescription(description)).toBeFalsy();
    expect(description).toContain(issue.key);
  });
});
