import * as core from '@actions/core'
import * as github from '@actions/github'
import { IssuesCreateCommentParams, PullsUpdateParams } from '@octokit/rest'

import {
  addComment,
  getJIRAClient,
  getJIRAIssueKeys,
  getJIRAIssueKeysByCustomRegexp,
  getPRDescription,
  getPRTitleComment,
  shouldSkipBranchLint,
  shouldUpdatePRDescription,
  updatePrDetails,
} from './utils'
import { JIRADetails, PullRequestParams } from './types'
import { getInputs } from './inputs'

export interface IGithubData {
  repository: any,
  owner: any,
  pullRequest: PullRequestParams
}

const getGithubData = (): IGithubData => {
  const {
    payload: {
      repository,
      organization: { login: owner },
      pull_request: pullRequest,
    },
  } = github.context
  return { repository, owner, pullRequest: pullRequest as PullRequestParams }
}

class Github {
  client: github.GitHub

  constructor() {
    const { GITHUB_TOKEN, } = getInputs()

    this.client = new github.GitHub(GITHUB_TOKEN)
  }

  async addComment(comment: any) {
    return await addComment(this.client, comment)

  }

  async updatePrDetails(prData: any) {
    return await updatePrDetails(this.client, prData)
  }

}
async function run(): Promise<void> {
  try {
    const {
      JIRA_TOKEN,
      JIRA_BASE_URL,
      BRANCH_IGNORE_PATTERN,
      JIRA_PROJECT_KEY,
      CUSTOM_ISSUE_NUMBER_REGEXP,
    } = getInputs();
    const { repository, owner, pullRequest } = getGithubData()
    if (typeof repository === 'undefined') {
      throw new Error(`Missing 'repository' from github action context.`);
    }

    const { name: repo } = repository;

    const {
      base: { ref: baseBranch },
      head: { ref: headBranch },
      number: prNumber = 0,
      body: prBody = '',
      title = '',
    } = pullRequest

    // common fields for both issue and comment
    const commonPayload = {
      owner,
      repo,
      issue_number: prNumber,
    };


    if (!headBranch && !baseBranch) {
      const commentBody = 'jira-lint is unable to determine the head and base branch';
      const comment: IssuesCreateCommentParams = {
        ...commonPayload,
        body: commentBody,
      };
      await githubConnector.addComment(comment)

      core.setFailed('Unable to get the head and base branch');
      process.exit(1);
    }

    console.log('Base branch -> ', baseBranch);
    console.log('Head branch -> ', headBranch);

    if (shouldSkipBranchLint(headBranch, BRANCH_IGNORE_PATTERN)) {
      process.exit(0);
    }
    const shouldUseCustomRegexp = !!CUSTOM_ISSUE_NUMBER_REGEXP && !!JIRA_PROJECT_KEY;

    const issueKeys = shouldUseCustomRegexp
      ? getJIRAIssueKeysByCustomRegexp(headBranch, CUSTOM_ISSUE_NUMBER_REGEXP, JIRA_PROJECT_KEY)
      : getJIRAIssueKeys(headBranch);

    if (!issueKeys.length) {
      console.log('JIRA issue id is missing in your branch, doing nothing')
      process.exit(1);
    }

    // use the last match (end of the branch name)
    const issueKey = issueKeys[issueKeys.length - 1];
    console.log(`JIRA key -> ${issueKey}`);

    const { getTicketDetails } = getJIRAClient(JIRA_BASE_URL, JIRA_TOKEN);
    const details: JIRADetails = await getTicketDetails(issueKey);
    if (details.key) {
      if (shouldUpdatePRDescription(prBody)) {
        const prData: PullsUpdateParams = {
          owner,
          repo,
          pull_number: prNumber,
          body: getPRDescription(prBody, details),
        };
        await githubConnector.updatePrDetails(prData);

        const prTitleComment: IssuesCreateCommentParams = {
            ...commonPayload,
            body: getPRTitleComment(details.summary, title),
          };
          console.log('Adding comment for the PR title');
        await githubConnector.addComment(prTitleComment)

      }
    }
  } catch (error) {
    console.log({ error });
    core.setFailed(error.message);
    process.exit(1);
  }
}

const githubConnector = new Github()
run();
