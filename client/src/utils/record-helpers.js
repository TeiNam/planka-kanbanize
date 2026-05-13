/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { StaticUserIds } from '../constants/StaticUsers';
import { KanbanListTypes, ListTypes, UserRoles } from '../constants/Enums';

export const isUserStatic = (user) => [StaticUserIds.DELETED].includes(user.id);

export const isUserAdminOrProjectOwner = (user) =>
  [UserRoles.ADMIN, UserRoles.PROJECT_OWNER].includes(user.role);

export const isListArchiveOrTrash = (list) =>
  [ListTypes.ARCHIVE, ListTypes.TRASH].includes(list.type);

export const isListFinite = (list) => KanbanListTypes.includes(list.type);

export const isListKanban = (list) => KanbanListTypes.includes(list.type);
