<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Contracts\AuthInterface;
use App\Contracts\SessionInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class AuthMiddleware implements MiddlewareInterface
{
  public function __construct(
    private readonly ResponseFactoryInterface $responseFactory,
    private readonly AuthInterface $auth,
    private readonly SessionInterface $session
  ) {
  }

  public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
  {
    if ($user = $this->auth->user()) {
      return $handler->handle($request->withAttribute('user', $user));
    }

    return $this->responseFactory->createResponse(302)->withHeader('Location', '/login');
  }
}