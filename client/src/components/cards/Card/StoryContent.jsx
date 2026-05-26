/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { Icon } from 'semantic-ui-react';

import selectors from '../../../selectors';
import markdownToText from '../../../utils/markdown-to-text';
import { BoardViews } from '../../../constants/Enums';
import TimeAgo from '../../common/TimeAgo';
import LabelChip from '../../labels/LabelChip';
import CustomFieldValueChip from '../../custom-field-values/CustomFieldValueChip';
import UserAvatar from '../../users/UserAvatar';
import CardBlockerBadge from '../CardBlockerBadge';
import CardSlaBar from '../CardSlaBar';
import CardPriority from '../CardPriority';
import CardClassOfServiceStripe from '../../classes-of-service/CardClassOfServiceStripe';

import styles from './StoryContent.module.scss';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const formatShortDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

// 오늘 기준 며칠 남았는지 (음수는 지난 날짜)
const daysUntil = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / MS_PER_DAY);
};

// 시작일(없으면 생성일)부터 완료일까지의 lead time(일).
// 두 시각 모두 있으면 양수 일수를 반환, 그 외엔 null.
const leadtimeDays = (startIso, endIso) => {
  if (!endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diff = Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY);
  return Math.max(0, diff);
};

const formatDueCountdown = (days) => {
  if (days === null || days === undefined) return '';
  if (days === 0) return 'D-Day';
  if (days < 0) return `D+${-days}`;
  return `D-${days}`;
};

const StoryContent = React.memo(({ cardId }) => {
  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);
  const selectListById = useMemo(() => selectors.makeSelectListById(), []);
  const selectLabelIdsByCardId = useMemo(() => selectors.makeSelectLabelIdsByCardId(), []);
  const selectUserIdsByCardId = useMemo(() => selectors.makeSelectUserIdsByCardId(), []);

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
  const labelIds = useSelector((state) => selectLabelIdsByCardId(state, cardId));
  const userIds = useSelector((state) => selectUserIdsByCardId(state, cardId));
  const attachmentsTotal = useSelector((state) => selectAttachmentsTotalByCardId(state, cardId));

  const customFieldValueIds = useSelector((state) =>
    selectShownOnFrontOfCardCustomFieldValueIdsByCardId(state, cardId),
  );

  const notificationsTotal = useSelector((state) =>
    selectNotificationsTotalByCardId(state, cardId),
  );

  const listName = useSelector((state) => {
    const board = selectors.selectCurrentBoard(state);
    return list.name && (board.view === BoardViews.KANBAN ? null : list.name);
  });

  const coverUrl = useSelector((state) => {
    const attachment = selectAttachmentById(state, card.coverAttachmentId);
    return attachment && attachment.data.thumbnailUrls.outside360;
  });

  const descriptionText = useMemo(
    () => card.description && markdownToText(card.description),
    [card.description],
  );

  const createdShort = formatShortDate(card.createdAt);
  const dueShort = formatShortDate(card.dueDate);
  const startShort = formatShortDate(card.startDate);
  const completedShort = formatShortDate(card.completedAt);
  const dueDays = daysUntil(card.dueDate);
  const leadtime = leadtimeDays(card.startDate || card.createdAt, card.completedAt);

  return (
    <>
      <CardClassOfServiceStripe classOfServiceId={card.classOfServiceId} />
      {coverUrl && (
        <div className={styles.coverWrapper}>
          <img src={coverUrl} alt="" className={styles.cover} />
        </div>
      )}
      <div className={styles.wrapper}>
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
          <span className={classNames(styles.labels)}>
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
        {card.id && <div className={styles.trackingId}>{`#${String(card.id).slice(-6)}`}</div>}
        <div className={styles.titleRow}>
          {userIds && userIds.length > 0 && (
            <span className={styles.members}>
              {userIds.slice(0, 3).map((userId) => (
                <UserAvatar key={userId} id={userId} size="tiny" />
              ))}
            </span>
          )}
          <div className={classNames(styles.name, card.isClosed && styles.nameClosed)}>
            {card.name}
          </div>
          <span className={styles.titleRowRight}>
            <CardPriority priority={card.priority} />
          </span>
        </div>
        {card.description && <div className={styles.descriptionText}>{descriptionText}</div>}

        {(createdShort || dueShort || startShort || completedShort) && (
          <div className={styles.dates}>
            {/* task 컬럼 카드는 생성일 대신 시작일 표시. 시작일이 없으면 생성일 fallback. */}
            {effectiveListType === 'task' && startShort && (
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
            {effectiveListType === 'task' && !startShort && createdShort && (
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
            {effectiveListType !== 'task' && (
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
            {dueShort && (
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

        {(attachmentsTotal > 0 || notificationsTotal > 0 || listName) && (
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
      </div>
    </>
  );
});

StoryContent.propTypes = {
  cardId: PropTypes.string.isRequired,
};

export default StoryContent;
