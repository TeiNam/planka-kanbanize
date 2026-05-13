/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Form, Radio, Segment, Select } from 'semantic-ui-react';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';

import styles from './SwimLanesSection.module.scss';

const EXPEDITE_WIP_OPTIONS = [
  { key: 1, value: 1, text: '1' },
  { key: 2, value: 2, text: '2' },
];

const SwimLanesSection = React.memo(() => {
  const selectBoardById = useMemo(() => selectors.makeSelectBoardById(), []);
  const boardId = useSelector((state) => selectors.selectCurrentModal(state).params.id);
  const board = useSelector((state) => selectBoardById(state, boardId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const handleToggleSwimLanes = useCallback(
    (_, { checked }) => {
      dispatch(entryActions.updateBoard(boardId, { isSwimLanesEnabled: checked }));
    },
    [boardId, dispatch],
  );

  const handleToggleExpedite = useCallback(
    (_, { checked }) => {
      dispatch(entryActions.updateBoard(boardId, { isExpediteLaneEnabled: checked }));
    },
    [boardId, dispatch],
  );

  const handleExpediteWipChange = useCallback(
    (_, { value }) => {
      if (value === board.expediteWipLimit) return;
      dispatch(entryActions.updateBoard(boardId, { expediteWipLimit: value }));
    },
    [board.expediteWipLimit, boardId, dispatch],
  );

  return (
    <Segment basic className={styles.wrapper}>
      <Form>
        <Form.Field className={styles.field}>
          <Radio
            toggle
            name="isSwimLanesEnabled"
            checked={board.isSwimLanesEnabled}
            label={t('common.swimLanesEnabled', { defaultValue: '스윔레인 사용' })}
            onChange={handleToggleSwimLanes}
          />
          <div className={styles.help}>
            {t('common.swimLanesEnabledHint', {
              defaultValue: '활성화하면 보드를 가로 스윔레인 단위로 그룹핑합니다.',
            })}
          </div>
        </Form.Field>

        <Form.Field className={styles.field}>
          <Radio
            toggle
            name="isExpediteLaneEnabled"
            checked={board.isExpediteLaneEnabled}
            label={t('common.expediteLaneEnabled', { defaultValue: '긴급 레인 사용' })}
            onChange={handleToggleExpedite}
          />
          <div className={styles.help}>
            {t('common.expediteLaneEnabledHint', {
              defaultValue:
                '스윔레인 사용 여부와 무관하게 긴급 카드 전용 레인을 최상단에 배치합니다.',
            })}
          </div>
        </Form.Field>

        {board.isExpediteLaneEnabled && (
          <Form.Field className={styles.field}>
            <label htmlFor="board-expedite-wip-limit" className={styles.label}>
              {t('common.expediteWipLimit', { defaultValue: '긴급 레인 WIP' })}
            </label>
            <Select
              id="board-expedite-wip-limit"
              options={EXPEDITE_WIP_OPTIONS}
              value={board.expediteWipLimit || 1}
              onChange={handleExpediteWipChange}
              className={styles.select}
            />
            <div className={styles.help}>
              {t('common.expediteWipLimitHint', {
                defaultValue: '기본 1, 최대 2까지 동시에 처리할 수 있습니다.',
              })}
            </div>
          </Form.Field>
        )}
      </Form>
    </Segment>
  );
});

export default SwimLanesSection;
