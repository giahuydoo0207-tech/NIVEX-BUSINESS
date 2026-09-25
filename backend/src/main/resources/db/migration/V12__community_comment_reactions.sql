alter table community_comment_likes
  add column reaction_type varchar(24) not null default 'LIKE';

alter table community_comment_likes
  add constraint community_comment_likes_reaction_type_check
  check (reaction_type in ('LIKE', 'LOVE', 'TRUST', 'BUILD', 'INSIGHTFUL', 'DEAL', 'LAUNCH'));
