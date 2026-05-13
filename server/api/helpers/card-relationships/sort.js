/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    parentCard: {
      type: 'ref',
      required: true,
    },
    board: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
    relationshipIds: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const { relationshipIds } = inputs;

    const relationships = await CardRelationship.qm.getByParentCardId(inputs.parentCard.id, {
      type: CardRelationship.Types.SUB_TICKET,
    });

    const relationshipById = _.keyBy(relationships, 'id');

    // position 재배치: 순서대로 65536 간격으로 할당
    const updatedRelationships = [];

    for (let i = 0; i < relationshipIds.length; i += 1) {
      const id = relationshipIds[i];
      const relationship = relationshipById[id];

      if (relationship) {
        const newPosition = (i + 1) * 65536;

        if (relationship.position !== newPosition) {
          // eslint-disable-next-line no-await-in-loop
          await CardRelationship.qm.updateOne({ id: relationship.id }, { position: newPosition });

          const updatedRelationship = {
            ...relationship,
            position: newPosition,
          };

          updatedRelationships.push(updatedRelationship);

          sails.sockets.broadcast(
            `board:${inputs.board.id}`,
            'cardRelationshipUpdate',
            {
              item: updatedRelationship,
            },
            inputs.request,
          );
        }
      }
    }

    return updatedRelationships;
  },
};
