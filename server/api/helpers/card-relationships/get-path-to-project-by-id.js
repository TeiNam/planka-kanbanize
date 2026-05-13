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
    const cardRelationship = await CardRelationship.qm.getOneById(inputs.id);

    if (!cardRelationship) {
      throw 'pathNotFound';
    }

    const pathToProject = await sails.helpers.cards
      .getPathToProjectById(cardRelationship.parentCardId)
      .intercept('pathNotFound', (nodes) => ({
        pathNotFound: {
          cardRelationship,
          ...nodes,
        },
      }));

    return {
      cardRelationship,
      ...pathToProject,
    };
  },
};
