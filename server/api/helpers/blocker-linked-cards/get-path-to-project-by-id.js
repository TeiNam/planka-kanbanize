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
    const blockerLinkedCard = await BlockerLinkedCard.qm.getOneById(inputs.id);

    if (!blockerLinkedCard) {
      throw 'pathNotFound';
    }

    const pathToProject = await sails.helpers.blockers
      .getPathToProjectById(blockerLinkedCard.blockerId)
      .intercept('pathNotFound', (nodes) => ({
        pathNotFound: {
          blockerLinkedCard,
          ...nodes,
        },
      }));

    return {
      blockerLinkedCard,
      ...pathToProject,
    };
  },
};
