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
    const classOfService = await ClassOfService.qm.getOneById(inputs.id);

    if (!classOfService) {
      throw 'pathNotFound';
    }

    const pathToProject = await sails.helpers.boards
      .getPathToProjectById(classOfService.boardId)
      .intercept('pathNotFound', (nodes) => ({
        pathNotFound: {
          classOfService,
          ...nodes,
        },
      }));

    return {
      classOfService,
      ...pathToProject,
    };
  },
};
