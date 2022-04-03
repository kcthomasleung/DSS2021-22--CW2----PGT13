CREATE DATABASE blog-website

create schema blog-website;
set schema 'blog-website';

create table user (
	user_id integer unique not null,
	username varchar(80) not null,
	user_email varchar(60) not null,
	user_password varchar(200) not null,
	primary key (user_id)
);





