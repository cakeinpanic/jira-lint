import {
  BOT_BRANCH_PATTERNS,
  DEFAULT_BRANCH_PATTERNS,
  HIDDEN_MARKER,
  JIRA_REGEX_MATCHER,
  MARKER_REGEX,
} from './constants';
import { JIRADetails } from './types';

export const getJIRAIssueKey = (input: string, regexp: RegExp = JIRA_REGEX_MATCHER): string | null => {
  const matches = input.toUpperCase().match(regexp);
  const keys = matches?.length ? matches : [null];
  return keys[0];
};

export const getJIRAIssueKeysByCustomRegexp = (
  input: string,
  numberRegexp: string,
  projectKey: string
): string | null => {
  const customRegexp = new RegExp(numberRegexp, 'g');
  const ticketNumber = getJIRAIssueKey(input, customRegexp);
  return ticketNumber ? `${projectKey}-${ticketNumber}` : null;
};

export const shouldSkipBranchLint = (branch: string, additionalIgnorePattern?: string): boolean => {
  if (BOT_BRANCH_PATTERNS.some((pattern) => pattern.test(branch))) {
    console.log(`You look like a bot 🤖 so we're letting you off the hook!`);
    return true;
  }

  if (DEFAULT_BRANCH_PATTERNS.some((pattern) => pattern.test(branch))) {
    console.log(`Ignoring check for default branch ${branch}`);
    return true;
  }

  const ignorePattern = new RegExp(additionalIgnorePattern || '');
  if (!!additionalIgnorePattern && ignorePattern.test(branch)) {
    console.log(
      `branch '${branch}' ignored as it matches the ignore pattern '${additionalIgnorePattern}' provided in skip-branches`
    );
    return true;
  }

  console.log(`branch '${branch}' does not match ignore pattern provided in 'skip-branches' option:`, ignorePattern);
  return false;
};

export const shouldUpdatePRDescription = (body?: string): boolean =>
  typeof body === 'string' && !MARKER_REGEX.test(body);

/** Get PR description with story/issue details. */
export const getPRDescription = (body = '', details: JIRADetails): string => {
  const displayKey = details.key.toUpperCase();

  return `
<details open>
  <summary><a href="${details.url}" title="${displayKey}" target="_blank">${displayKey}</a></summary>
  <br />
  <table>
    <tr>
      <th>Summary</th>
      <td>${details.summary}</td>
    </tr>
    <tr>
      <th>Type</th>
      <td>
        <img alt="${details.type.name}" src="${details.type.icon}" />
        ${details.type.name}
      </td>
    </tr>
  </table>
</details>
<!--
  do not remove this marker as it will break jira-lint's functionality.
  ${HIDDEN_MARKER}
-->

---
${body}`;
};
