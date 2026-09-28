alter table community_post_reactions drop constraint if exists community_post_reactions_reaction_type_check;
alter table community_post_reactions add constraint community_post_reactions_reaction_type_check
  check (reaction_type in ('LIKE', 'LOVE', 'HAHA', 'TRUST', 'BUILD', 'INSIGHTFUL', 'DEAL', 'LAUNCH'));

alter table community_comment_likes drop constraint if exists community_comment_likes_reaction_type_check;
alter table community_comment_likes add constraint community_comment_likes_reaction_type_check
  check (reaction_type in ('LIKE', 'LOVE', 'HAHA', 'TRUST', 'BUILD', 'INSIGHTFUL', 'DEAL', 'LAUNCH'));
