import * as core from '@actions/core'
import { getJIRAIssueKey, getJIRAIssueKeysByCustomRegexp, shouldSkipBranchLint, } from './utils'
import { getInputs } from './inputs'
import { GithubConnector } from './github-connector'
import { JiraConnector } from './jira-connector'

async function run(): Promise<void> {
  try {
    const { BRANCH_IGNORE_PATTERN } = getInputs();

    const githubConnector = new GithubConnector()
    const jiraConnector = new JiraConnector()

    if (shouldSkipBranchLint(githubConnector.headBranch, BRANCH_IGNORE_PATTERN)) {
      process.exit(0);
    }

    const issueKey = getIssueKey(githubConnector.headBranch)

    if (!issueKey) {
      console.log(`JIRA issue id is missing in your branch ${githubConnector.headBranch}, doing nothing`)
      process.exit(1);
    }

    console.log(`JIRA key -> ${issueKey}`);

    const details = await jiraConnector.getTicketDetails(issueKey)
    await githubConnector.updatePrDetails(details)


  } catch (error) {
    console.log({ error });
    core.setFailed(error.message);
    process.exit(1);
  }
}

const getIssueKey = (headBranch: string): string | null => {
  const { JIRA_PROJECT_KEY, CUSTOM_ISSUE_NUMBER_REGEXP } = getInputs()

  const shouldUseCustomRegexp = !!CUSTOM_ISSUE_NUMBER_REGEXP && !!JIRA_PROJECT_KEY

  return shouldUseCustomRegexp
    ? getJIRAIssueKeysByCustomRegexp(headBranch, CUSTOM_ISSUE_NUMBER_REGEXP, JIRA_PROJECT_KEY)
    : getJIRAIssueKey(headBranch)
}
run();
