import { getInputs } from './inputs';
import { JIRADetails, PullRequestParams } from './types';
import { PullsUpdateParams } from '@octokit/rest';
import { getJIRAIssueKey, getJIRAIssueKeysByCustomRegexp, getPRDescription, shouldUpdatePRDescription } from './utils';
import * as github from '@actions/github';
import * as core from '@actions/core';

/** Update a PR details. */
export const updatePrDetails = async (client: github.GitHub, prData: PullsUpdateParams): Promise<void> => {
  try {
    await client.pulls.update(prData);
  } catch (error) {
    core.setFailed(error.message);
    process.exit(1);
  }
};

export class GithubConnector {
  client: github.GitHub;

  constructor() {
    const { GITHUB_TOKEN } = getInputs();

    this.client = new github.GitHub(GITHUB_TOKEN);
  }

  get headBranch(): string {
    const { pullRequest } = getGithubData();
    const {
      head: { ref: headBranch },
    } = pullRequest;

    return headBranch;
  }

  getIssueKeyFromTitle(): string | null {
    const { pullRequest } = getGithubData();
    const { JIRA_PROJECT_KEY, CUSTOM_ISSUE_NUMBER_REGEXP } = getInputs();

    const shouldUseCustomRegexp = !!CUSTOM_ISSUE_NUMBER_REGEXP && !!JIRA_PROJECT_KEY;
    const PRTitle = pullRequest.title;

    console.log(PRTitle);

    if (!PRTitle) {
      console.log(`JIRA issue id is missing in your PR title ${PRTitle}, doing nothing`);
      return null;
    }
    return shouldUseCustomRegexp
      ? getJIRAIssueKeysByCustomRegexp(PRTitle, CUSTOM_ISSUE_NUMBER_REGEXP, JIRA_PROJECT_KEY)
      : getJIRAIssueKey(PRTitle);
  }
  async updatePrDetails(details: JIRADetails) {
    const { repository, owner, pullRequest } = getGithubData();
    const { name: repo } = repository;

    const { number: prNumber = 0, body: prBody = '' } = pullRequest;
    if (!shouldUpdatePRDescription(prBody)) {
      return;
    }
    const prData: PullsUpdateParams = {
      owner,
      repo,
      pull_number: prNumber,
      body: getPRDescription(prBody, details),
    };
    return await updatePrDetails(this.client, prData);
  }
}

export interface IGithubData {
  repository: any;
  owner: any;
  pullRequest: PullRequestParams;
}

export const getGithubData = (): IGithubData => {
  const {
    payload: {
      repository,
      organization: { login: owner },
      pull_request: pullRequest,
    },
  } = github.context;
  return {
    repository,
    owner,
    pullRequest: pullRequest as PullRequestParams,
  };
};
