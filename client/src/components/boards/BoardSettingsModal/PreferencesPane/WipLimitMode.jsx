/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Form, Radio, Segment } from 'semantic-ui-react';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';

import styles from './WipLimitMode.module.scss';

const MODES = ['warn', 'block'];

const WipLimitMode = React.memo(() => {
  const selectBoardById = useMemo(() => selectors.makeSelectBoardById(), []);
  const boardId = useSelector((state) => selectors.selectCurrentModal(state).params.id);
  const board = useSelector((state) => selectBoardById(state, boardId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const current = board.wipLimitMode || 'warn';

  const handleChange = useCallback(
    (_, { value }) => {
      if (value === current) return;
      dispatch(entryActions.updateBoard(boardId, { wipLimitMode: value }));
    },
    [current, boardId, dispatch],
  );

  return (
    <Segment basic className={styles.wrapper}>
      <Form>
        {MODES.map((mode) => (
          <Form.Field key={mode} className={styles.field}>
            <Radio
              name="wipLimitMode"
              value={mode}
              checked={current === mode}
              label={t(`common.wipLimitMode_${mode}`, {
                defaultValue: mode === 'warn' ? 'Warn only (soft)' : 'Block exceeding moves (hard)',
              })}
              onChange={handleChange}
            />
            <div className={styles.help}>
              {t(`common.wipLimitMode_${mode}_hint`, {
                defaultValue:
                  mode === 'warn'
                    ? 'Allow moves that exceed WIP limits, but show a warning.'
                    : 'Reject moves that would exceed any WIP limit.',
              })}
            </div>
          </Form.Field>
        ))}
      </Form>
    </Segment>
  );
});

export default WipLimitMode;
