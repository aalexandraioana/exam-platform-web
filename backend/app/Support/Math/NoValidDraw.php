<?php

namespace App\Support\Math;

use RuntimeException;

/** No set of values met the conditions and the whole-number rule within the draw limit (D-059 preview check). */
class NoValidDraw extends RuntimeException {}
