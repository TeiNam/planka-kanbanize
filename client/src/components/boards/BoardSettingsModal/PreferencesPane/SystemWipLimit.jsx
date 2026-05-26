/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Form, Input, Segment } from 'semantic-ui-react';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';

import styles from './SystemWipLimit.module.scss';

const parseValue = (raw) => {
  const trimmed = String(raw).trim();
  if (trimmed === '') {
    return null;
  }
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 1 || n > 1000) {
    return undefined; // invalid
  }
  return n;
};

const SystemWipLimit = React.memo(() => {
  const selectBoardById = useMemo(() => selectors.makeSelectBoardById(), []);
  const boardId = useSelector((state) => selectors.selectCurrentModal(state).params.id);
  const board = useSelector((state) => selectBoardById(state, boardId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const initialValue =
    board.systemWipLimit === null || board.systemWipLimit === undefined
      ? ''
      : String(board.systemWipLimit);
  const [value, setValue] = useState(initialValue);
  const lastSavedRef = useRef(initialValue);

  useEffect(() => {
    const next =
      board.systemWipLimit === null || board.systemWipLimit === undefined
        ? ''
        : String(board.systemWipLimit);
    if (next !== lastSavedRef.current) {
      lastSavedRef.current = next;
      setValue(next);
    }
  }, [board.systemWipLimit]);

  const handleChange = useCallback((_, { value: nextValue }) => {
    setValue(nextValue);
  }, []);

  const commit = useCallback(() => {
    if (value === lastSavedRef.current) {
      return;
    }
    const parsed = parseValue(value);
    if (parsed === undefined) {
      // invalid — revert
      setValue(lastSavedRef.current);
      return;
    }
    lastSavedRef.current = value;
    dispatch(entryActions.updateBoard(boardId, { systemWipLimit: parsed }));
  }, [value, boardId, dispatch]);

  const handleBlur = useCallback(() => {
    commit();
  }, [commit]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.target.blur();
    }
  }, []);

  return (
    <Segment basic className={styles.wrapper}>
      <Form>
        <Form.Field>
          <label htmlFor="board-system-wip-limit" className={styles.label}>
            {t('common.systemWipLimit', { defaultValue: 'Total WIP limit' })}
          </label>
          <Input
            id="board-system-wip-limit"
            type="number"
            min={1}
            max={1000}
            placeholder={t('common.unlimited', { defaultValue: 'No limit' })}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          <div className={styles.help}>
            {t('common.systemWipLimitHint', {
              defaultValue:
                'Total number of cards allowed across task columns. Leave empty for no limit.',
            })}
          </div>
        </Form.Field>
      </Form>
    </Segment>
  );
});

export default SystemWipLimit;
