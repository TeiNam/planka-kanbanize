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
    const swimLane = await SwimLane.qm.getOneById(inputs.id);

    if (!swimLane) {
      throw 'pathNotFound';
    }

    const pathToProject = await sails.helpers.boards
      .getPathToProjectById(swimLane.boardId)
      .intercept('pathNotFound', (nodes) => ({
        pathNotFound: {
          swimLane,
          ...nodes,
        },
      }));

    return {
      swimLane,
      ...pathToProject,
    };
  },
};
