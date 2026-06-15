/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Form, Input, Radio, Segment } from 'semantic-ui-react';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';
import { getCardPrefixWidth, isCardPrefix } from '../../../../utils/card-prefix';

import styles from './CardPrefix.module.scss';

// 순번 미리보기 포맷 (서버 규칙과 동일: 10 미만은 0 패딩)
const formatPreviewNumber = (n) => (n < 10 ? `0${n}` : String(n));

const CardPrefix = React.memo(() => {
  const selectBoardById = useMemo(() => selectors.makeSelectBoardById(), []);
  const boardId = useSelector((state) => selectors.selectCurrentModal(state).params.id);
  const board = useSelector((state) => selectBoardById(state, boardId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const enabled = !!board.cardPrefixEnabled;

  const initialValue = board.cardPrefix || '';
  const [value, setValue] = useState(initialValue);
  const lastSavedRef = useRef(initialValue);

  useEffect(() => {
    const next = board.cardPrefix || '';
    if (next !== lastSavedRef.current) {
      lastSavedRef.current = next;
      setValue(next);
    }
  }, [board.cardPrefix]);

  const handleToggleChange = useCallback(
    (_, { checked }) => {
      dispatch(entryActions.updateBoard(boardId, { cardPrefixEnabled: checked }));
    },
    [boardId, dispatch],
  );

  const handleChange = useCallback((_, { value: nextValue }) => {
    setValue(nextValue);
  }, []);

  const commit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed === lastSavedRef.current) {
      return;
    }
    // 유효하지 않으면(허용 문자 외 또는 폭 초과) 이전 값으로 되돌린다.
    if (!isCardPrefix(trimmed)) {
      setValue(lastSavedRef.current);
      return;
    }
    lastSavedRef.current = trimmed;
    setValue(trimmed);
    dispatch(entryActions.updateBoard(boardId, { cardPrefix: trimmed }));
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

  const isOverWidth = getCardPrefixWidth(value.trim()) > 4;

  return (
    <Segment basic className={styles.wrapper}>
      <Radio
        toggle
        name="cardPrefixEnabled"
        checked={enabled}
        label={t('common.cardPrefixEnabled', { defaultValue: 'Auto-prefix new card titles' })}
        className={styles.radio}
        onChange={handleToggleChange}
      />
      <Form>
        <Form.Field>
          <label htmlFor="board-card-prefix" className={styles.label}>
            {t('common.cardPrefix', { defaultValue: 'Prefix' })}
          </label>
          <Input
            id="board-card-prefix"
            disabled={!enabled}
            maxLength={4}
            placeholder={t('common.cardPrefixPlaceholder', { defaultValue: 'e.g. DB' })}
            value={value}
            error={isOverWidth}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          <div className={styles.help}>
            {t('common.cardPrefixHint', {
              defaultValue:
                'Up to 2 Korean or 4 Latin characters. New cards become "[PREFIX-01] ...".',
            })}
          </div>
          {enabled && value.trim() && !isOverWidth && (
            <div className={styles.preview}>
              {`[${value.trim()}-${formatPreviewNumber(board.cardPrefixNextNumber || 1)}] `}
            </div>
          )}
        </Form.Field>
      </Form>
    </Segment>
  );
});

export default CardPrefix;
