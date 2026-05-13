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
    const decorator = await Decorator.qm.getOneById(inputs.id);

    if (!decorator) {
      throw 'pathNotFound';
    }

    const pathToProject = await sails.helpers.boards
      .getPathToProjectById(decorator.boardId)
      .intercept('pathNotFound', (nodes) => ({
        pathNotFound: {
          decorator,
          ...nodes,
        },
      }));

    return {
      decorator,
      ...pathToProject,
    };
  },
};
