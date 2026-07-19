import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { TeamDetailPage } from './team-detail-page';
import { ChildDto } from '../../../api/model/child-dto';
import { PersonDto } from '../../../api/model/person-dto';
import { PhoneType } from '../../../api/model/phone-type';

describe('TeamDetailPage', () => {
  let component: TeamDetailPage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'team-1' }) } }
        }
      ]
    });

    component = TestBed.createComponent(TeamDetailPage).componentInstance;
  });

  it('formats the person\'s own phone numbers as contact entries', () => {
    const person: PersonDto = {
      id: 'p1',
      firstName: 'Dominik',
      lastName: 'Möhring',
      phoneNumbers: [{ id: 'ph1', type: PhoneType.Mobile, number: '0176 622 55859' }]
    };

    expect(component.getContactEntries(person)).toEqual([
      { label: 'Mobil', number: '0176 622 55859', tel: '017662255859' }
    ]);
  });

  it('returns an empty list when the person has no phone number and is not a known child', () => {
    const person: PersonDto = { id: 'p2', firstName: 'Ohne', lastName: 'Nummer', phoneNumbers: [] };

    expect(component.getContactEntries(person)).toEqual([]);
  });

  it('appends guardian contacts for a child, labeled with the relation type and name', () => {
    const child: PersonDto = { id: 'child-1', firstName: 'Johannes', lastName: 'Möhring', phoneNumbers: [] };
    const mother: PersonDto = {
      id: 'mother-1',
      firstName: 'Juliane',
      lastName: 'Möhring',
      phoneNumbers: [{ id: 'ph2', type: PhoneType.Mobile, number: '017643352732' }]
    };
    const father: PersonDto = {
      id: 'father-1',
      firstName: 'Dominik',
      lastName: 'Möhring',
      phoneNumbers: [{ id: 'ph3', type: PhoneType.Mobile, number: '017662255859' }]
    };

    const children: ChildDto[] = [
      { child, guardians: { MOTHER: [mother], FATHER: [father] } }
    ];
    component.children.set(children);

    expect(component.getContactEntries(child)).toEqual([
      { label: 'Mutter Juliane Möhring', number: '017643352732', tel: '017643352732' },
      { label: 'Vater Dominik Möhring', number: '017662255859', tel: '017662255859' }
    ]);
  });

  it('labels phone types and relation types in German', () => {
    expect(component.getPhoneTypeLabel(PhoneType.Mobile)).toBe('Mobil');
    expect(component.getPhoneTypeLabel(PhoneType.Home)).toBe('Privat');
    expect(component.getPhoneTypeLabel(PhoneType.Emergency)).toBe('Notfall');
    expect(component.getRelationLabel('MOTHER')).toBe('Mutter');
    expect(component.getRelationLabel('FATHER')).toBe('Vater');
  });
});
