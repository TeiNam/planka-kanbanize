/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { ORM } from 'redux-orm';

import {
  Activity,
  Attachment,
  BackgroundImage,
  BaseCustomFieldGroup,
  Blocker,
  BlockerLinkedCard,
  Board,
  BoardDailySnapshot,
  BoardMembership,
  Card,
  CardDecorator,
  CardRelationship,
  ClassOfService,
  Comment,
  CommitmentPoint,
  CustomField,
  CustomFieldGroup,
  CustomFieldValue,
  Decorator,
  Label,
  List,
  Notification,
  NotificationService,
  Project,
  ProjectManager,
  SwimLane,
  CalendarEvent,
  Task,
  TaskList,
  User,
  Webhook,
} from './models';

const orm = new ORM({
  stateSelector: (state) => state.orm,
});

orm.register(
  Webhook,
  User,
  Project,
  ProjectManager,
  BackgroundImage,
  BaseCustomFieldGroup,
  Board,
  BoardMembership,
  Label,
  List,
  Card,
  TaskList,
  Task,
  Attachment,
  CustomFieldGroup,
  CustomField,
  CustomFieldValue,
  Comment,
  Activity,
  Notification,
  NotificationService,
  SwimLane,
  CalendarEvent,
  CommitmentPoint,
  ClassOfService,
  Decorator,
  CardDecorator,
  Blocker,
  BlockerLinkedCard,
  CardRelationship,
  BoardDailySnapshot,
);

export default orm;
