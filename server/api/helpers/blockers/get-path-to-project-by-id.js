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
    const blocker = await Blocker.qm.getOneById(inputs.id);

    if (!blocker) {
      throw 'pathNotFound';
    }

    const pathToProject = await sails.helpers.cards
      .getPathToProjectById(blocker.cardId)
      .intercept('pathNotFound', (nodes) => ({
        pathNotFound: {
          blocker,
          ...nodes,
        },
      }));

    return {
      blocker,
      ...pathToProject,
    };
  },
};
