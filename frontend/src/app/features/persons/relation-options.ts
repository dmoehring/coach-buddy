import { RelationType } from '../../api/model/relation-type';

export type RelationRole = 'CHILD' | 'GUARDIAN';

export interface RelationTypeOption {
  label: string;
  value: RelationType;
}

export interface RelationRoleOption {
  label: string;
  value: RelationRole;
}

export const RELATION_ROLE_OPTIONS: RelationRoleOption[] = [
  { label: 'Diese Person ist das Kind', value: 'CHILD' },
  { label: 'Diese Person ist die Kontaktperson', value: 'GUARDIAN' }
];

export const RELATION_TYPE_OPTIONS: RelationTypeOption[] = [
  { label: 'Mutter', value: RelationType.Mother },
  { label: 'Vater', value: RelationType.Father },
  { label: 'Großmutter', value: RelationType.Grandmother },
  { label: 'Großvater', value: RelationType.Grandfather },
  { label: 'Stiefelternteil', value: RelationType.StepParent },
  { label: 'Sonstige', value: RelationType.Other }
];
