import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigEdit } from './config-edit';

describe('ConfigEdit', () => {
  let component: ConfigEdit;
  let fixture: ComponentFixture<ConfigEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
