-- Functional Programming Primitives Library for Lua (Written by Claude (Copyright 2025))
f = {}

-- Map: Apply function to each element
function f.map(tbl, fn)
	local result = {}
	for i, v in ipairs(tbl) do
		result[i] = fn(v, i)
	end
	return result
end

-- Filter: Keep elements that satisfy predicate
function f.filter(tbl, predicate)
	local result = {}
	for i, v in ipairs(tbl) do
		if predicate(v, i) then
			table.insert(result, v)
		end
	end
	return result
end

-- Reduce/Fold: Accumulate values with function
function f.reduce(tbl, fn, init)
	local acc = init
	for i, v in ipairs(tbl) do
		acc = fn(acc, v, i)
	end
	return acc
end

-- Find: Return first element matching predicate
function f.find(tbl, predicate)
	for i, v in ipairs(tbl) do
		if predicate(v, i) then
			return v
		end
	end
	return nil
end

-- Any: Check if any element satisfies predicate
function f.any(tbl, predicate)
	for i, v in ipairs(tbl) do
		if predicate(v, i) then
			return true
		end
	end
	return false
end

-- All: Check if all elements satisfy predicate
function f.all(tbl, predicate)
	for i, v in ipairs(tbl) do
		if not predicate(v, i) then
			return false
		end
	end
	return true
end

-- Take: Get first n elements
function f.take(tbl, n)
	local result = {}
	for i = 1, math.min(n, #tbl) do
		result[i] = tbl[i]
	end
	return result
end

-- Drop: Skip first n elements
function f.drop(tbl, n)
	local result = {}
	for i = n + 1, #tbl do
		table.insert(result, tbl[i])
	end
	return result
end

-- Reverse: Reverse table order
function f.reverse(tbl)
	local result = {}
	for i = #tbl, 1, -1 do
		table.insert(result, tbl[i])
	end
	return result
end

-- Concat: Flatten one level of nested tables
function f.concat(tbl)
	local result = {}
	for i, v in ipairs(tbl) do
		if type(v) == "table" then
			for j, item in ipairs(v) do
				table.insert(result, item)
			end
		else
			table.insert(result, v)
		end
	end
	return result
end

-- Zip: Combine two tables into pairs
function f.zip(tbl1, tbl2)
	local result = {}
	local len = math.min(#tbl1, #tbl2)
	for i = 1, len do
		result[i] = { tbl1[i], tbl2[i] }
	end
	return result
end

-- Unique: Remove duplicate values
function f.unique(tbl)
	local seen = {}
	local result = {}
	for i, v in ipairs(tbl) do
		if not seen[v] then
			seen[v] = true
			table.insert(result, v)
		end
	end
	return result
end

-- Compose: Function composition (right to left)
function f.compose(...)
	local fns = { ... }
	return function(x)
		local result = x
		for i = #fns, 1, -1 do
			result = fns[i](result)
		end
		return result
	end
end

-- Pipe: Function composition (left to right)
function f.pipe(...)
	local fns = { ... }
	return function(x)
		local result = x
		for i = 1, #fns do
			result = fns[i](result)
		end
		return result
	end
end

-- Partial: Partial function application
function f.partial(fn, ...)
	local args = { ... }
	return function(...)
		local all_args = {}
		for i, v in ipairs(args) do
			all_args[i] = v
		end
		local start = #args + 1
		for i, v in ipairs({ ... }) do
			all_args[start + i - 1] = v
		end
		return fn(table.unpack(all_args))
	end
end

-- To pairs: Convert key-value table to list of {key, value} pairs
function f.to_pairs(tbl)
	local result = {}
	for k, v in pairs(tbl) do
		table.insert(result, { k, v })
	end
	return result
end

-- From pairs: Convert list of {key, value} pairs to key-value table
function f.from_pairs(pairs_list)
	local result = {}
	for i, pair in ipairs(pairs_list) do
		result[pair[1]] = pair[2]
	end
	return result
end

-- Example usage:
--[[
local numbers = {1, 2, 3, 4, 5}

-- Double each number
local doubled = f.map(numbers, function(x) return x * 2 end)

-- Filter even numbers
local evens = f.filter(numbers, function(x) return x % 2 == 0 end)

-- Sum all numbers
local sum = f.reduce(numbers, function(acc, x) return acc + x end, 0)

-- Chain operations
local result = f.pipe(
  function(x) return f.map(x, function(n) return n * 2 end) end,
  function(x) return f.filter(x, function(n) return n > 5 end) end
)(numbers)
--]]
