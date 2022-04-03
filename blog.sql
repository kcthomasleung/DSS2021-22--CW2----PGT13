CREATE DATABASE blog-website

create schema blog-website;
set schema 'blog-website';

--if recreating the database, need to drop tables in this order to avoid constraint violations
--drop table roombooking;
--drop table booking;
--drop table customer;
--drop table room;
--drop table rates;

create table user (
	user_id integer unique not null,
	username varchar(80) not null,
	user_email varchar(60) not null,
	user_password varchar(200) not null,
	primary key (user_id)
);





