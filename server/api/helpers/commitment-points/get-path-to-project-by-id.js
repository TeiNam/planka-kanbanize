/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    pathNotFound: {},
  },

  async fn(inputs) {
    const commitmentPoint = await CommitmentPoint.qm.getOneById(inputs.id);

    if (!commitmentPoint) {
      throw 'pathNotFound';
    }

    const pathToProject = await sails.helpers.boards
      .getPathToProjectById(commitmentPoint.boardId)
      .intercept('pathNotFound', (nodes) => ({
        pathNotFound: {
          commitmentPoint,
          ...nodes,
        },
      }));

    return {
      commitmentPoint,
      ...pathToProject,
    };
  },
};
