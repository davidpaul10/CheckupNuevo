import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GreenPass } from './green-pass';

describe('GreenPass', () => {
  let component: GreenPass;
  let fixture: ComponentFixture<GreenPass>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GreenPass],
    }).compileComponents();

    fixture = TestBed.createComponent(GreenPass);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
