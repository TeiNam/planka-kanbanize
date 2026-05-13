/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  BLOCKER_LINKED_CARD_NOT_FOUND: {
    blockerLinkedCardNotFound: 'Blocker linked card not found',
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
    blockerLinkedCardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const pathToProject = await sails.helpers.blockerLinkedCards
      .getPathToProjectById(inputs.id)
      .intercept('pathNotFound', () => Errors.BLOCKER_LINKED_CARD_NOT_FOUND);

    let { blockerLinkedCard } = pathToProject;
    const { board, project } = pathToProject;

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.BLOCKER_LINKED_CARD_NOT_FOUND;
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    blockerLinkedCard = await sails.helpers.blockerLinkedCards.deleteOne.with({
      project,
      board,
      record: blockerLinkedCard,
      actorUser: currentUser,
      request: this.req,
    });

    if (!blockerLinkedCard) {
      throw Errors.BLOCKER_LINKED_CARD_NOT_FOUND;
    }

    return {
      item: blockerLinkedCard,
    };
  },
};
