import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PersonDetailPage } from './person-detail-page';
import { PersonDto } from '../../../api/model/person-dto';
import { PhoneType } from '../../../api/model/phone-type';
import { RelationType } from '../../../api/model/relation-type';

describe('PersonDetailPage', () => {
  let component: PersonDetailPage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'person-1' }),
              queryParamMap: convertToParamMap({})
            }
          }
        }
      ]
    });

    component = TestBed.createComponent(PersonDetailPage).componentInstance;
  });

  it('defaults returnUrl to the persons list when no returnUrl query param is present', () => {
    expect(component.returnUrl).toBe('/persons');
  });

  it('formats a person\'s own phone numbers as contact entries', () => {
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

  it('returns an empty list for a person without phone numbers', () => {
    expect(component.getContactEntries({ id: 'p2', phoneNumbers: [] })).toEqual([]);
  });

  it('falls back to the nickname when no first/last name is set', () => {
    expect(component.getPersonName({ nickname: 'Jo' })).toBe('Jo');
    expect(component.getPersonName(undefined)).toBe('Unbekannte Person');
  });

  it('labels relation types in German', () => {
    expect(component.getRelationTypeLabel(RelationType.Mother)).toBe('Mutter');
    expect(component.getRelationTypeLabel(RelationType.Father)).toBe('Vater');
    expect(component.getRelationTypeLabel(RelationType.StepParent)).toBe('Stiefelternteil');
  });
});

describe('PersonDetailPage returnUrl', () => {
  it('uses the returnUrl query param when present', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'person-1' }),
              queryParamMap: convertToParamMap({ returnUrl: '/teams/team-1' })
            }
          }
        }
      ]
    });

    const component = TestBed.createComponent(PersonDetailPage).componentInstance;

    expect(component.returnUrl).toBe('/teams/team-1');
  });
});
