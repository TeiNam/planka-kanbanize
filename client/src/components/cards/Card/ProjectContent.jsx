/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Icon } from 'semantic-ui-react';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { startStopwatch, stopStopwatch } from '../../../utils/stopwatch';
import { isListArchiveOrTrash } from '../../../utils/record-helpers';
import { BoardMembershipRoles, BoardViews } from '../../../constants/Enums';
import TaskList from './TaskList';
import StopwatchChip from '../StopwatchChip';
import TimeAgo from '../../common/TimeAgo';
import UserAvatar from '../../users/UserAvatar';
import LabelChip from '../../labels/LabelChip';
import CustomFieldValueChip from '../../custom-field-values/CustomFieldValueChip';
import CardBlockerBadge from '../CardBlockerBadge';
import CardSlaBar from '../CardSlaBar';
import CardPriority from '../CardPriority';
import CardClassOfServiceStripe from '../../classes-of-service/CardClassOfServiceStripe';

import styles from './ProjectContent.module.scss';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const formatShortDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const daysUntil = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / MS_PER_DAY);
};

const formatDueCountdown = (days) => {
  if (days === null || days === undefined) return '';
  if (days === 0) return 'D-Day';
  if (days < 0) return `D+${-days}`;
  return `D-${days}`;
};

const leadtimeDays = (startIso, endIso) => {
  if (!endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diff = Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY);
  return Math.max(0, diff);
};

const ProjectContent = React.memo(({ cardId }) => {
  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);
  const selectListById = useMemo(() => selectors.makeSelectListById(), []);
  const selectUserIdsByCardId = useMemo(() => selectors.makeSelectUserIdsByCardId(), []);
  const selectLabelIdsByCardId = useMemo(() => selectors.makeSelectLabelIdsByCardId(), []);

  const selectShownOnFrontOfCardTaskListIdsByCardId = useMemo(
    () => selectors.makeSelectShownOnFrontOfCardTaskListIdsByCardId(),
    [],
  );

  const selectAttachmentsTotalByCardId = useMemo(
    () => selectors.makeSelectAttachmentsTotalByCardId(),
    [],
  );

  const selectShownOnFrontOfCardCustomFieldValueIdsByCardId = useMemo(
    () => selectors.makeSelectShownOnFrontOfCardCustomFieldValueIdsByCardId(),
    [],
  );

  const selectNotificationsTotalByCardId = useMemo(
    () => selectors.makeSelectNotificationsTotalByCardId(),
    [],
  );

  const selectAttachmentById = useMemo(() => selectors.makeSelectAttachmentById(), []);

  const selectParentListById = useMemo(() => selectors.makeSelectListById(), []);
  const card = useSelector((state) => selectCardById(state, cardId));
  const list = useSelector((state) => selectListById(state, card.listId));
  const parentList = useSelector((state) =>
    list && list.parentListId ? selectParentListById(state, list.parentListId) : null,
  );
  const effectiveListType = parentList ? parentList.type : list && list.type;
  const userIds = useSelector((state) => selectUserIdsByCardId(state, cardId));
  const labelIds = useSelector((state) => selectLabelIdsByCardId(state, cardId));

  const taskListIds = useSelector((state) =>
    selectShownOnFrontOfCardTaskListIdsByCardId(state, cardId),
  );

  const attachmentsTotal = useSelector((state) => selectAttachmentsTotalByCardId(state, cardId));

  const customFieldValueIds = useSelector((state) =>
    selectShownOnFrontOfCardCustomFieldValueIdsByCardId(state, cardId),
  );

  const notificationsTotal = useSelector((state) =>
    selectNotificationsTotalByCardId(state, cardId),
  );

  const coverUrl = useSelector((state) => {
    const attachment = selectAttachmentById(state, card.coverAttachmentId);
    return attachment && attachment.data.thumbnailUrls.outside360;
  });

  const { listName, withCreator } = useSelector((state) => {
    const board = selectors.selectCurrentBoard(state);

    return {
      listName: list.name && (board.view === BoardViews.KANBAN ? null : list.name),
      withCreator: board.alwaysDisplayCardCreator,
    };
  }, shallowEqual);

  const canEditStopwatch = useSelector((state) => {
    if (isListArchiveOrTrash(list)) {
      return false;
    }

    const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);
    return !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;
  });

  const dispatch = useDispatch();

  const handleToggleStopwatchClick = useCallback(
    (event) => {
      event.stopPropagation();

      dispatch(
        entryActions.updateCard(cardId, {
          stopwatch: card.stopwatch.startedAt
            ? stopStopwatch(card.stopwatch)
            : startStopwatch(card.stopwatch),
        }),
      );
    },
    [cardId, card.stopwatch, dispatch],
  );

  const createdShort = formatShortDate(card.createdAt);
  const dueShort = formatShortDate(card.dueDate);
  const startShort = formatShortDate(card.startDate);
  const completedShort = formatShortDate(card.completedAt);
  const dueDays = daysUntil(card.dueDate);
  const leadtime = leadtimeDays(card.startDate || card.createdAt, card.completedAt);

  // 설명/댓글 아이콘은 멤버 바로 아래 줄로 분리. 나머지(시계/리스트명/첨부)만 attachments 줄에 둔다.
  const hasIndicators = card.description || card.commentsTotal > 0;

  const hasInformation =
    card.stopwatch || attachmentsTotal > 0 || notificationsTotal > 0 || listName;

  const isTaskList = effectiveListType === 'task';
  const hasDateRow =
    (isTaskList ? startShort || createdShort : createdShort || startShort) ||
    dueShort ||
    completedShort;

  // 생성자: 보드 설정이 켜져있으면 좌측 상단(타이틀 줄)
  const creatorNode = withCreator ? (
    <span className={styles.creator}>
      <UserAvatar withCreatorIndicator id={card.creatorUserId} size="tiny" />
    </span>
  ) : null;

  // 멤버: 카드 하단 우측 정렬
  const membersNode =
    userIds.length > 0 ? (
      <span className={styles.members}>
        {userIds.slice(0, 3).map((userId) => (
          <UserAvatar key={userId} id={userId} size="tiny" />
        ))}
        {userIds.length > 3 && (
          <span className={styles.membersMore}>{`+${userIds.length - 3}`}</span>
        )}
      </span>
    ) : null;

  return (
    <>
      <CardClassOfServiceStripe classOfServiceId={card.classOfServiceId} />
      {coverUrl && (
        <div className={styles.coverWrapper}>
          <img src={coverUrl} alt="" className={styles.cover} />
        </div>
      )}
      <div className={styles.wrapper}>
        {card.id && <div className={styles.trackingId}>{`#${String(card.id).slice(-6)}`}</div>}
        <div className={styles.titleRow}>
          {creatorNode}
          <div className={classNames(styles.name, card.isClosed && styles.nameClosed)}>
            {card.name}
          </div>
          <span className={styles.titleRowRight}>
            <CardPriority priority={card.priority} />
          </span>
        </div>
        {labelIds.length > 0 && (
          <span className={styles.labels}>
            {labelIds.map((labelId) => (
              <span key={labelId} className={classNames(styles.attachment, styles.attachmentLeft)}>
                <LabelChip id={labelId} size="tiny" />
              </span>
            ))}
          </span>
        )}
        {customFieldValueIds.length > 0 && (
          <span className={styles.labels}>
            {customFieldValueIds.map((customFieldValueId) => (
              <span
                key={customFieldValueId}
                className={classNames(styles.attachment, styles.attachmentLeft)}
              >
                <CustomFieldValueChip id={customFieldValueId} size="tiny" />
              </span>
            ))}
          </span>
        )}
        {taskListIds.map((taskListId) => (
          <TaskList key={taskListId} id={taskListId} />
        ))}

        {hasDateRow && (
          <div className={styles.dates}>
            {/* task 컬럼 카드는 생성일 대신 시작일 표시. 시작일이 없으면 생성일 fallback. */}
            {isTaskList && startShort && (
              <div className={styles.dateLine}>
                <Icon name="play" />
                <span className={styles.dateLabel}>시작일:</span>
                <span className={styles.dateValue}>{startShort}</span>
                {card.startDate && (
                  <span className={styles.dateAge}>
                    <Icon name="history" className={styles.dateAgeIcon} />
                    <TimeAgo date={new Date(card.startDate)} />
                  </span>
                )}
              </div>
            )}
            {isTaskList && !startShort && createdShort && (
              <div className={styles.dateLine}>
                <Icon name="calendar outline" />
                <span className={styles.dateLabel}>생성일:</span>
                <span className={styles.dateValue}>{createdShort}</span>
                {card.createdAt && (
                  <span className={styles.dateAge}>
                    <Icon name="history" className={styles.dateAgeIcon} />
                    <TimeAgo date={new Date(card.createdAt)} />
                  </span>
                )}
              </div>
            )}
            {!isTaskList && (
              <>
                {createdShort && (
                  <div className={styles.dateLine}>
                    <Icon name="calendar outline" />
                    <span className={styles.dateLabel}>생성일:</span>
                    <span className={styles.dateValue}>{createdShort}</span>
                    {card.createdAt && (
                      <span className={styles.dateAge}>
                        <Icon name="history" className={styles.dateAgeIcon} />
                        <TimeAgo date={new Date(card.createdAt)} />
                      </span>
                    )}
                  </div>
                )}
                {startShort && (
                  <div className={styles.dateLine}>
                    <Icon name="play" />
                    <span className={styles.dateLabel}>시작일:</span>
                    <span className={styles.dateValue}>{startShort}</span>
                  </div>
                )}
              </>
            )}
            {card.dueDate && (
              <div className={styles.dateLine}>
                <Icon name="calendar alternate outline" />
                <span className={styles.dateLabel}>마감일:</span>
                <span className={styles.dateValue}>{dueShort}</span>
                {dueDays !== null && (
                  <span
                    className={classNames(styles.dateAge, dueDays < 0 && styles.dateAgeOverdue)}
                  >
                    ({formatDueCountdown(dueDays)})
                  </span>
                )}
              </div>
            )}
            {completedShort && (
              <div className={styles.dateLine}>
                <Icon
                  name={effectiveListType === 'discard' ? 'trash alternate outline' : 'check'}
                />
                <span className={styles.dateLabel}>
                  {effectiveListType === 'discard' ? '폐기일:' : '완료일:'}
                </span>
                <span className={styles.dateValue}>{completedShort}</span>
                {leadtime !== null && (
                  <span className={styles.dateAge}>(Leadtime: {leadtime}일)</span>
                )}
              </div>
            )}
          </div>
        )}

        <CardSlaBar cardId={cardId} />

        {hasInformation && (
          <span className={styles.attachments}>
            {notificationsTotal > 0 && (
              <span
                className={classNames(
                  styles.attachment,
                  styles.attachmentLeft,
                  styles.notification,
                )}
              >
                {notificationsTotal}
              </span>
            )}
            {card.stopwatch && (
              <span className={classNames(styles.attachment, styles.attachmentLeft)}>
                <StopwatchChip
                  value={card.stopwatch}
                  as="span"
                  size="tiny"
                  onClick={canEditStopwatch ? handleToggleStopwatchClick : undefined}
                />
              </span>
            )}
            {listName && (
              <span className={classNames(styles.attachment, styles.attachmentLeft)}>
                <span className={styles.attachmentContent}>
                  <Icon name="columns" />
                  {listName}
                </span>
              </span>
            )}
            {attachmentsTotal > 0 && (
              <span className={classNames(styles.attachment, styles.attachmentLeft)}>
                <span className={styles.attachmentContent}>
                  <Icon name="attach" />
                  {attachmentsTotal}
                </span>
              </span>
            )}
          </span>
        )}
        <span className={styles.badges}>
          <CardBlockerBadge cardId={cardId} />
        </span>
        {(hasIndicators || membersNode) && (
          <div className={styles.bottomRow}>
            <div className={styles.bottomIndicators}>
              {card.description && (
                <span className={styles.indicator} title="설명 있음">
                  <Icon name="align left" />
                </span>
              )}
              {card.commentsTotal > 0 && (
                <span className={styles.indicator} title="댓글">
                  <Icon name="comment outline" />
                  {card.commentsTotal}
                </span>
              )}
            </div>
            {membersNode}
          </div>
        )}
      </div>
    </>
  );
});

ProjectContent.propTypes = {
  cardId: PropTypes.string.isRequired,
};

export default ProjectContent;
