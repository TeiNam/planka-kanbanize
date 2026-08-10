/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    recordOrRecords: {
      type: 'ref',
      required: true,
    },
  },

  async fn(inputs) {
    let cardIdOrIds;
    if (_.isPlainObject(inputs.recordOrRecords)) {
      ({
        recordOrRecords: { id: cardIdOrIds },
      } = inputs);
    } else if (_.every(inputs.recordOrRecords, _.isPlainObject)) {
      cardIdOrIds = sails.helpers.utils.mapRecords(inputs.recordOrRecords);
    }

    await CardSubscription.qm.delete({
      cardId: cardIdOrIds,
    });

    await CardMembership.qm.delete({
      cardId: cardIdOrIds,
    });

    await CardLabel.qm.delete({
      cardId: cardIdOrIds,
    });

    const taskLists = await TaskList.qm.delete({
      cardId: cardIdOrIds,
    });

    await sails.helpers.taskLists.deleteRelated(taskLists);

    await Task.qm.update(
      {
        linkedCardId: cardIdOrIds,
      },
      {
        linkedCardId: null,
      },
    );

    const { uploadedFiles } = await Attachment.qm.delete({
      cardId: cardIdOrIds,
    });

    sails.helpers.utils.removeUnreferencedUploadedFiles(uploadedFiles);

    const customFieldGroups = await CustomFieldGroup.qm.delete({
      cardId: cardIdOrIds,
    });

    await sails.helpers.customFieldGroups.deleteRelated(customFieldGroups);

    await Comment.qm.delete({
      cardId: cardIdOrIds,
    });

    await Action.qm.delete({
      cardId: cardIdOrIds,
    });

    // 칸반 확장 테이블 정리 (FK CASCADE 가 없어 앱 레벨에서 정리한다)
    // 고아 blocker 가 남으면 해당 블로커 API 전체가 pathNotFound 로 깨진다.
    // blocker_linked_card 는 DB CASCADE(card_id/blocker_id) 로 함께 정리된다.
    await Blocker.qm.delete({
      cardId: cardIdOrIds,
    });

    await CardCommitmentLog.qm.delete({
      cardId: cardIdOrIds,
    });

    await CardMovementLog.qm.delete({
      cardId: cardIdOrIds,
    });

    await CardRelationship.qm.delete({
      or: [{ parentCardId: cardIdOrIds }, { childCardId: cardIdOrIds }],
    });
  },
};
