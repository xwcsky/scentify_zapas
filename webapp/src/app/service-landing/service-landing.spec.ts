import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceLanding } from './service-landing';

describe('ServiceLanding', () => {
  let component: ServiceLanding;
  let fixture: ComponentFixture<ServiceLanding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceLanding]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceLanding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
