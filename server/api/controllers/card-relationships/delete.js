/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  CARD_RELATIONSHIP_NOT_FOUND: {
    cardRelationshipNotFound: 'Card relationship not found',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    cardRelationshipNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const pathToProject = await sails.helpers.cardRelationships
      .getPathToProjectById(inputs.id)
      .intercept('pathNotFound', () => Errors.CARD_RELATIONSHIP_NOT_FOUND);

    let { cardRelationship } = pathToProject;
    const { board, project } = pathToProject;

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.CARD_RELATIONSHIP_NOT_FOUND;
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    cardRelationship = await sails.helpers.cardRelationships.deleteOne.with({
      project,
      board,
      record: cardRelationship,
      actorUser: currentUser,
      request: this.req,
    });

    if (!cardRelationship) {
      throw Errors.CARD_RELATIONSHIP_NOT_FOUND;
    }

    return {
      item: cardRelationship,
    };
  },
};
