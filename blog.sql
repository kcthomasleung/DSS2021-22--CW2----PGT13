CREATE DATABASE blog-website

create schema blog-website;
set schema 'blog-website';

create table users (
	user_id serial unique not null,
	username varchar(100) unique not null,
	email varchar(100) unique not null,
	password varchar(200) not null,
	salt varchar(200) not null,
	created_at timestamp default now(),
	twofa boolean default false,
	verify integer, 
	primary key (user_id)
);

create table blogs (
	blog_id serial unique not null,
	title varchar(100) not null,
	content varchar(400) not null,
	user_id int not null,
	created_at timestamp default now(),
	primary key (blog_id),
	foreign key (user_id) references users(user_id)
);


insert into users (username, email, password, salt) values ('admin', 'admin@admin.com', 'admin','asddfgiuahdsfliadyfgoiaudhf');
insert into users (username, email, password, salt) VALUES ('asdf', 'asdfasdf', 'asdfasdfasdf', 'asdfasdf')

