terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }
}


provider "aws" {
  region = var.region
}


module "networking" {
  source             = "../modules/networking"
  cidr_block         = var.cidr_block
  availability_zones = var.availability_zones
  public_subnets     = var.public_subnet_ips
  private_subnet_ips = var.private_subnet_ips
}


module "security" {
  source = "../modules/security"
  vpc_id = module.networking.vpc_id
  region = var.region
}
