resource "aws_lb" "load_balancer" {
  name                       = "bookstore-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = var.load_balance_security_group_ids
  subnets                    = var.load_balance_subnet_ids
  enable_deletion_protection = false

  enable_http2                     = true
  idle_timeout                     = 60
  enable_cross_zone_load_balancing = true

  tags = {
    Name = "bookstore-alb"
  }

}
resource "aws_lb_listener" "listener" {
  load_balancer_arn = aws_lb.load_balancer.arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nodejs_target_group.arn
  }
}

resource "aws_lb_listener" "name" {
  load_balancer_arn = aws_lb.load_balancer.arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nodejs_target_group.arn
  }
}
