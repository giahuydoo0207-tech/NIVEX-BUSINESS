alter table business_profile_assets drop constraint if exists business_profile_assets_asset_type_check;
alter table business_profile_assets alter column asset_type type varchar(16);
alter table business_profile_assets add constraint business_profile_assets_asset_type_check
  check (asset_type in ('AVATAR', 'COVER', 'COVER_ORIGINAL'));
